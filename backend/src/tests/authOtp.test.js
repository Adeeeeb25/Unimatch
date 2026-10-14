import assert from 'node:assert/strict';
import { pool, OTP_TABLE, USERS_TABLE } from '../config/db.js';
import connectDB from '../config/db.js';
import {
  isEmailDomainAllowed,
  getApprovedEmailDomains
} from '../features/auth/authController.js';
import {
  generateSecureNumericOtp,
  hashOtp,
  requestEmailOtp,
  resendEmailOtp,
  verifyEmailOtp
} from '../services/otpService.js';
import {
  sendVerificationOtpEmail,
  getEmailProviderStatus,
  __getTestInbox,
  __clearTestInbox
} from '../services/emailService.js';
import {
  createUser,
  findUserByEmail,
  markUserVerifiedByEmail
} from '../features/user/userRepository.js';

process.env.NODE_ENV = 'test';
process.env.OTP_RESEND_COOLDOWN_SECONDS = '2'; // Fast cooldown for test execution
process.env.OTP_EXPIRY_MINUTES = '10';
process.env.OTP_MAX_ATTEMPTS = '5';
process.env.ALLOWED_EMAIL_DOMAINS = 'cuchd.in,connect.cuchd.in';

let passedTests = 0;
let totalTests = 0;

const runTest = async (name, fn) => {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
};

const cleanupTestUser = async (email) => {
  await pool.query(`DELETE FROM ${OTP_TABLE} WHERE email = $1`, [email]);
  await pool.query(`DELETE FROM ${USERS_TABLE} WHERE email = $1`, [email]);
};

export const runAllTests = async () => {
  console.log('\n======================================================');
  console.log('🧪 Starting UniMatch Email OTP & Verification Test Suite');
  console.log('======================================================\n');

  // Initialize schema & migrations
  await connectDB(3, 1000);

  // --------------------------------------------------------
  // Test 1: Approved University Email Domain Restriction
  // --------------------------------------------------------
  await runTest('Strict validation of approved university email domains', async () => {
    assert.equal(await isEmailDomainAllowed('alex@cuchd.in'), true, 'cuchd.in should be allowed');
    assert.equal(await isEmailDomainAllowed('student@connect.cuchd.in'), true, 'connect.cuchd.in should be allowed');
    assert.equal(await isEmailDomainAllowed('user@gmail.com'), false, 'Public gmail should be rejected');
    assert.equal(await isEmailDomainAllowed('user@yahoo.com'), false, 'Public yahoo should be rejected');
    assert.equal(await isEmailDomainAllowed('hacker@unapproved-domain.org'), false, 'Unapproved domain should be rejected');
    assert.equal(await isEmailDomainAllowed('invalid-email-string'), false, 'Malformed email should be rejected');
  });

  // --------------------------------------------------------
  // Test 2: Cryptographically Secure 6-Digit Numeric OTP Generation
  // --------------------------------------------------------
  await runTest('Cryptographically secure 6-digit numeric OTP generation', async () => {
    for (let i = 0; i < 20; i++) {
      const code = generateSecureNumericOtp();
      assert.equal(typeof code, 'string', 'OTP must be a string');
      assert.equal(code.length, 6, 'OTP must be exactly 6 characters');
      assert.match(code, /^\d{6}$/, 'OTP must be purely numeric');
      const num = parseInt(code, 10);
      assert.ok(num >= 100000 && num <= 999999, 'OTP must be between 100000 and 999999');
    }
  });

  // --------------------------------------------------------
  // Test 3: Keyed HMAC Hashing for Short Numeric OTPs
  // --------------------------------------------------------
  await runTest('Keyed HMAC hashing prevents offline brute-force precomputation', async () => {
    const otp = '482910';
    const hashA = hashOtp(otp);
    const hashB = hashOtp(otp);

    assert.equal(hashA, hashB, 'Same OTP with same key produces identical HMAC');
    assert.equal(hashA.length, 64, 'HMAC-SHA256 hex string must be 64 characters');
    assert.notEqual(hashA, otp, 'OTP must not be stored in plaintext');

    // Different code produces different hash
    const hashC = hashOtp('482911');
    assert.notEqual(hashA, hashC, 'Different OTP produces different HMAC');
  });

  // --------------------------------------------------------
  // Test 4: Email Provider Integration & Branded Template
  // --------------------------------------------------------
  await runTest('Email service dispatches branded HTML email with security notice', async () => {
    __clearTestInbox();
    const testEmail = 'maya@cuchd.in';
    const testOtp = '654321';

    const result = await sendVerificationOtpEmail(testEmail, testOtp);
    assert.equal(result.delivered, true, 'Delivery must be reported as delivered');
    assert.equal(result.provider, 'test', 'Provider must report test in test mode');

    const inbox = __getTestInbox();
    assert.equal(inbox.length, 1, 'One email must be in test inbox');
    const email = inbox[0];
    assert.equal(email.to, testEmail, 'Recipient must match');
    assert.equal(email.subject, 'Verify your UniMatch email', 'Subject must match requirements');
    assert.ok(email.text.includes('10 minutes'), 'Plain text must mention 10-minute expiry');
    assert.ok(email.text.includes('Security Notice'), 'Plain text must include security notice');
    assert.ok(email.html.includes(testOtp), 'HTML must contain the OTP');
    assert.ok(email.html.includes('UniMatch'), 'HTML must include UniMatch branding');
  });

  // --------------------------------------------------------
  // Test 5: End-to-End Account Registration & Verification
  // --------------------------------------------------------
  await runTest('New student starts unverified and becomes verified after correct OTP', async () => {
    const studentEmail = 'test.student.reg@cuchd.in';
    await cleanupTestUser(studentEmail);
    __clearTestInbox();

    // 1. Create unverified pending registration
    const user = await createUser({
      email: studentEmail,
      password: '$2b$12$dummyhashedpassword12345678901234567890123456789012',
      name: 'Maya Test',
      isVerified: false
    });
    assert.equal(user.isVerified, false, 'New student account must start with isVerified = false');

    // 2. Request OTP email
    await requestEmailOtp(studentEmail);
    const inbox = __getTestInbox();
    assert.equal(inbox.length, 1, 'Verification email must be dispatched');
    const sentOtp = inbox[0].otp;

    // 3. Submit correct OTP
    const verifyResult = await verifyEmailOtp(studentEmail, sentOtp);
    assert.equal(verifyResult.valid, true, 'Verification with correct OTP must succeed');

    // 4. Mark account verified
    const verifiedUser = await markUserVerifiedByEmail(studentEmail);
    assert.equal(verifiedUser.isVerified, true, 'Account must be marked isVerified = true');

    // Clean up
    await cleanupTestUser(studentEmail);
  });

  // --------------------------------------------------------
  // Test 6: Rejection of Incorrect OTP & Attempt Counting
  // --------------------------------------------------------
  await runTest('Incorrect OTP is rejected and remaining attempts are decremented', async () => {
    const studentEmail = 'test.student.incorrect@cuchd.in';
    await cleanupTestUser(studentEmail);
    __clearTestInbox();

    await requestEmailOtp(studentEmail);

    // Submit wrong OTP
    const check1 = await verifyEmailOtp(studentEmail, '000000');
    assert.equal(check1.valid, false, 'Wrong code must be rejected');
    assert.ok(check1.error.includes('4 attempts remaining'), 'Attempts remaining must decrement to 4');

    const check2 = await verifyEmailOtp(studentEmail, '111111');
    assert.equal(check2.valid, false, 'Second wrong code must be rejected');
    assert.ok(check2.error.includes('3 attempts remaining'), 'Attempts remaining must decrement to 3');

    await cleanupTestUser(studentEmail);
  });

  // --------------------------------------------------------
  // Test 7: Max Attempt Lockout (5 Incorrect Attempts)
  // --------------------------------------------------------
  await runTest('Exceeding 5 incorrect attempts locks and deletes the code', async () => {
    const studentEmail = 'test.student.lockout@cuchd.in';
    await cleanupTestUser(studentEmail);
    __clearTestInbox();

    await requestEmailOtp(studentEmail);

    for (let i = 0; i < 4; i++) {
      await verifyEmailOtp(studentEmail, '999999');
    }

    // 5th attempt locks the code
    const check5 = await verifyEmailOtp(studentEmail, '999999');
    assert.equal(check5.valid, false, '5th attempt must fail');
    assert.ok(check5.error.includes('locked'), 'Error must report code is locked');

    // Next attempt reports no active code found
    const check6 = await verifyEmailOtp(studentEmail, '999999');
    assert.equal(check6.valid, false);
    assert.ok(check6.error.includes('No active verification code'), 'Locked code must be removed from DB');

    await cleanupTestUser(studentEmail);
  });

  // --------------------------------------------------------
  // Test 8: Expired OTP Rejection
  // --------------------------------------------------------
  await runTest('Expired OTP codes are rejected and cleaned up safely', async () => {
    const studentEmail = 'test.student.expired@cuchd.in';
    await cleanupTestUser(studentEmail);

    const pastExpiry = new Date(Date.now() - 5000); // 5 seconds ago
    const otp = '334455';
    const otpHash = hashOtp(otp);

    await pool.query(
      `INSERT INTO ${OTP_TABLE} (email, otp_hash, expires_at, attempts)
       VALUES ($1, $2, $3, 0)`,
      [studentEmail, otpHash, pastExpiry]
    );

    const result = await verifyEmailOtp(studentEmail, otp);
    assert.equal(result.valid, false, 'Expired OTP must be rejected');
    assert.ok(result.error.includes('expired'), 'Error must mention code has expired');

    // Database record should be deleted
    const countRes = await pool.query(`SELECT COUNT(*) FROM ${OTP_TABLE} WHERE email = $1`, [studentEmail]);
    assert.equal(parseInt(countRes.rows[0].count, 10), 0, 'Expired record must be purged');

    await cleanupTestUser(studentEmail);
  });

  // --------------------------------------------------------
  // Test 9: One-Time Use / Invalidation After Success
  // --------------------------------------------------------
  await runTest('OTP cannot be reused after successful verification (one-time use)', async () => {
    const studentEmail = 'test.student.reuse@cuchd.in';
    await cleanupTestUser(studentEmail);
    __clearTestInbox();

    await requestEmailOtp(studentEmail);
    const sentOtp = __getTestInbox()[0].otp;

    // First use: Valid
    const firstCheck = await verifyEmailOtp(studentEmail, sentOtp);
    assert.equal(firstCheck.valid, true, 'First use of OTP must succeed');

    // Second use: Invalid
    const secondCheck = await verifyEmailOtp(studentEmail, sentOtp);
    assert.equal(secondCheck.valid, false, 'Replaying consumed OTP must fail');
    assert.ok(secondCheck.error.includes('No active verification code'), 'Consumed OTP must not exist in DB');

    await cleanupTestUser(studentEmail);
  });

  // --------------------------------------------------------
  // Test 10: Resend Cooldown Enforcement
  // --------------------------------------------------------
  await runTest('Resend cooldown prevents rapid repeated requests within cooldown window', async () => {
    const studentEmail = 'test.student.cooldown@cuchd.in';
    await cleanupTestUser(studentEmail);
    __clearTestInbox();

    // Initial request
    await requestEmailOtp(studentEmail);

    // Immediate second request within 2s cooldown must throw 429
    let threwError = false;
    try {
      await resendEmailOtp(studentEmail);
    } catch (err) {
      threwError = true;
      assert.equal(err.statusCode, 429, 'Immediate resend must return 429 status');
      assert.ok(err.message.includes('Please wait'), 'Message must request waiting for cooldown');
    }
    assert.ok(threwError, 'Immediate resend must be rejected with an error');

    // Wait for cooldown to expire
    await new Promise((r) => setTimeout(r, 2200));

    // Resend after cooldown succeeds
    const resendResult = await resendEmailOtp(studentEmail);
    assert.ok(resendResult.expiresAt, 'Resend after cooldown must succeed');

    await cleanupTestUser(studentEmail);
  });

  // --------------------------------------------------------
  // Test 11: Invalidation of Previous OTP on Resend
  // --------------------------------------------------------
  await runTest('Generating a new OTP invalidates the previous OTP code', async () => {
    const studentEmail = 'test.student.inval@cuchd.in';
    await cleanupTestUser(studentEmail);
    __clearTestInbox();

    // 1. Initial OTP
    await requestEmailOtp(studentEmail);
    const initialOtp = __getTestInbox()[0].otp;

    // 2. Wait cooldown and resend
    await new Promise((r) => setTimeout(r, 2200));
    await resendEmailOtp(studentEmail);
    const newOtp = __getTestInbox()[1].otp;

    assert.notEqual(initialOtp, newOtp, 'New OTP should be a different random number');

    // 3. Old OTP should now be rejected
    const oldCheck = await verifyEmailOtp(studentEmail, initialOtp);
    assert.equal(oldCheck.valid, false, 'Old OTP must be invalidated when a new one is issued');

    // 4. New OTP should succeed
    const newCheck = await verifyEmailOtp(studentEmail, newOtp);
    assert.equal(newCheck.valid, true, 'Newest OTP must be accepted');

    await cleanupTestUser(studentEmail);
  });

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================\n');

  // Close pool connection so test process exits cleanly
  await pool.end();
};

runAllTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  pool.end().finally(() => process.exit(1));
});
