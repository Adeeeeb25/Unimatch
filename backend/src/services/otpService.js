import crypto from 'crypto';
import { pool, OTP_TABLE } from '../config/db.js';
import { sendVerificationOtpEmail } from './emailService.js';

const getOtpExpiryMinutes = () => Number(process.env.OTP_EXPIRY_MINUTES || 10);
const getMaxAttempts = () => Number(process.env.OTP_MAX_ATTEMPTS || 5);
const getResendCooldownSeconds = () => Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
const getMaxResends = () => Number(process.env.OTP_MAX_RESENDS || 5);

/**
 * Server-side secret for Keyed HMAC hashing of short numeric OTPs.
 * Protects 6-digit space against offline precomputation and rainbow-table attacks.
 */
const getHmacSecret = () => {
  return (
    process.env.OTP_HMAC_SECRET ||
    process.env.JWT_SECRET ||
    'unimatch-otp-fallback-hmac-salt-secret-production'
  );
};

export const hashOtp = (otp) => {
  const secret = getHmacSecret();
  return crypto.createHmac('sha256', secret).update(String(otp).trim()).digest('hex');
};

const timingSafeCompareHex = (aHex, bHex) => {
  if (typeof aHex !== 'string' || typeof bHex !== 'string') return false;
  try {
    const bufA = Buffer.from(aHex, 'hex');
    const bufB = Buffer.from(bHex, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 * Returns standard 6-character string from '100000' to '999999'.
 */
export const generateSecureNumericOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Request generation and email delivery of a 6-digit verification code.
 * Enforces cooldown timers and maximum resend thresholds.
 */
export const requestEmailOtp = async (email, isResend = false) => {
  const normalizedEmail = email.trim().toLowerCase();
  const cooldownSeconds = getResendCooldownSeconds();
  const maxResends = getMaxResends();
  const expiryMinutes = getOtpExpiryMinutes();

  // Check existing active OTP for rate-limiting and cooldown enforcement
  const existingRes = await pool.query(
    `SELECT id, last_resend_at, resend_count, created_at
     FROM ${OTP_TABLE}
     WHERE email = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalizedEmail]
  );

  let currentResendCount = 0;
  if (existingRes.rows.length > 0) {
    const record = existingRes.rows[0];
    const lastTime = new Date(record.last_resend_at || record.created_at).getTime();
    const elapsedSeconds = Math.floor((Date.now() - lastTime) / 1000);

    if (elapsedSeconds < cooldownSeconds) {
      const waitRemaining = cooldownSeconds - elapsedSeconds;
      const error = new Error(`Please wait ${waitRemaining} seconds before requesting another verification code.`);
      error.statusCode = 429;
      error.retryAfter = waitRemaining;
      throw error;
    }

    if (record.resend_count >= maxResends) {
      const error = new Error('Maximum verification code requests reached. Please try again after 15 minutes.');
      error.statusCode = 429;
      throw error;
    }

    currentResendCount = (record.resend_count || 0) + (isResend ? 1 : 0);
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = generateSecureNumericOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  // Invalidate any old codes for this email
  await pool.query(`DELETE FROM ${OTP_TABLE} WHERE email = $1`, [normalizedEmail]);

  // Insert new record with Keyed HMAC hash
  await pool.query(
    `INSERT INTO ${OTP_TABLE} (email, otp_hash, expires_at, attempts, resend_count, last_resend_at, created_at, updated_at)
     VALUES ($1, $2, $3, 0, $4, NOW(), NOW(), NOW())`,
    [normalizedEmail, otpHash, expiresAt, currentResendCount]
  );

  // Dispatch via configured email provider (Resend, SMTP, or test store)
  const emailResult = await sendVerificationOtpEmail(normalizedEmail, otp);

  return {
    expiresAt,
    expiresInMinutes: expiryMinutes,
    resendCooldownSeconds: cooldownSeconds,
    emailResult
  };
};

/**
 * Resend verification code (explicit wrapper enforcing resend cooldown)
 */
export const resendEmailOtp = async (email) => {
  return requestEmailOtp(email, true);
};

/**
 * Verify submitted 6-digit OTP code against stored Keyed HMAC hash.
 * Enforces expiration, attempt limits, and deletes code immediately on success.
 */
export const verifyEmailOtp = async (email, candidateOtp) => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = String(candidateOtp || '').trim();
  const maxAttempts = getMaxAttempts();

  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return {
      valid: false,
      error: 'Please enter a valid 6-digit numeric verification code.'
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
      error: 'No active verification code found for this email. Please request a new code.'
    };
  }

  const record = res.rows[0];

  // 1. Expiry check
  if (new Date() > new Date(record.expires_at)) {
    await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);
    return {
      valid: false,
      error: 'This verification code has expired. Please request a new code.'
    };
  }

  // 2. Max attempts check
  if (record.attempts >= maxAttempts) {
    await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);
    return {
      valid: false,
      error: 'Too many incorrect attempts. This verification code has been locked. Please request a new code.'
    };
  }

  // 3. Constant-time comparison of Keyed HMAC
  const candidateHash = hashOtp(cleanOtp);
  const isMatch = timingSafeCompareHex(candidateHash, record.otp_hash);

  if (!isMatch) {
    const updatedAttempts = record.attempts + 1;
    if (updatedAttempts >= maxAttempts) {
      await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);
      return {
        valid: false,
        error: 'Too many incorrect attempts. This verification code has been locked. Please request a new code.'
      };
    }

    await pool.query(
      `UPDATE ${OTP_TABLE}
       SET attempts = attempts + 1, updated_at = NOW()
       WHERE id = $1`,
      [record.id]
    );

    const remaining = maxAttempts - updatedAttempts;
    return {
      valid: false,
      error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
    };
  }

  // 4. Verification Succeeded — invalidate code immediately to prevent replay attacks
  await pool.query(`DELETE FROM ${OTP_TABLE} WHERE id = $1`, [record.id]);

  return { valid: true };
};
