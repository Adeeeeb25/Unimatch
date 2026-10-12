import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool, OTP_TABLE } from '../config/db.js';
import { sendVerificationOtpEmail } from './emailService.js';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit numeric OTP,
 * store hashed version in database, and dispatch email.
 */
export const requestEmailOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Generate 6-digit string between '100000' and '999999'
  const otpNumber = crypto.randomInt(100000, 1000000);
  const otp = otpNumber.toString();

  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Remove previous OTPs for this email to prevent multiple valid codes
  await pool.query(`DELETE FROM ${OTP_TABLE} WHERE email = $1`, [normalizedEmail]);

  // Store new OTP
  await pool.query(
    `INSERT INTO ${OTP_TABLE} (email, otp_hash, expires_at, attempts)
     VALUES ($1, $2, $3, 0)`,
    [normalizedEmail, otpHash, expiresAt]
  );

  // Send via email service
  const emailResult = await sendVerificationOtpEmail(normalizedEmail, otp);

  return {
    otp, // used for dev mode previews
    expiresAt,
    emailResult
  };
};

/**
 * Verify submitted 6-digit OTP against active database record.
 */
export const verifyEmailOtp = async (email, candidateOtp) => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = String(candidateOtp || '').trim();

  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      valid: false,
      error: 'Please enter a valid 6-digit verification code.'
    };
  }

  const res = await pool.query(
    `SELECT id, otp_hash, expires_at, attempts
     FROM ${OTP_TABLE}
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    return {
      valid: false,
      error: 'No verification code found for this email. Please request a new code.'
    };
  }

  const record = res.rows[0];

  // Check expiration
  if (new Date() > new Date(record.expires_at)) {
    await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);
    return {
      valid: false,
      error: 'Verification code has expired. Please request a new code.'
    };
  }

  // Check attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);
    return {
      valid: false,
      error: 'Too many incorrect attempts. Please request a new verification code.'
    };
  }

  // Compare hash
  const isMatch = await bcrypt.compare(cleanOtp, record.otp_hash);

  if (!isMatch) {
    await pool.query(
      `UPDATE ${OTP_TABLE} SET attempts = attempts + 1 WHERE id = $1`,
      [record.id]
    );
    const remaining = MAX_ATTEMPTS - (record.attempts + 1);
    return {
      valid: false,
      error: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`
    };
  }

  // Successfully verified — remove record so it cannot be re-used
  await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);

  return { valid: true };
};
