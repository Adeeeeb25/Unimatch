import bcrypt from 'bcrypt';
import { pool, DOMAINS_TABLE } from '../../config/db.js';
import { createToken } from '../shared/tokenService.js';
import {
  createUser,
  findUserByEmail,
  markUserVerifiedByEmail,
  updateUnverifiedUser
} from '../user/userRepository.js';
import { requestEmailOtp, resendEmailOtp, verifyEmailOtp } from '../../services/otpService.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolve approved institutional university email domains from environment and verified campus records.
 */
export const getApprovedEmailDomains = async () => {
  const envRaw = process.env.ALLOWED_EMAIL_DOMAINS;
  let domains = [];

  if (envRaw) {
    domains = envRaw
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  // Include approved domains from campus database
  try {
    const dbRes = await pool.query(
      `SELECT domain FROM ${DOMAINS_TABLE} WHERE status = 'verified'`
    );
    for (const row of dbRes.rows) {
      const d = row.domain?.trim().toLowerCase();
      if (d && !domains.includes(d)) {
        domains.push(d);
      }
    }
  } catch (err) {
    // Graceful fallback to env if database query fails
  }

  // If no specific domains configured, enforce authorized campus domain
  if (domains.length === 0) {
    domains = ['cuchd.in', 'connect.cuchd.in'];
  }

  return domains;
};

/**
 * Validate that an email belongs to an explicit approved university domain.
 */
export const isEmailDomainAllowed = async (email) => {
  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (!emailDomain) return false;

  const approvedDomains = await getApprovedEmailDomains();
  return approvedDomains.some(
    (allowed) => emailDomain === allowed || emailDomain.endsWith(`.${allowed}`)
  );
};

/**
 * POST /api/auth/register (and alias /api/auth/send-otp)
 * Enforce university domain, create/update pending unverified user, and dispatch 6-digit OTP.
 */
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'University email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid university email address' });
    }

    // Server-side strict approved university domain check
    const isAllowed = await isEmailDomainAllowed(normalizedEmail);
    if (!isAllowed) {
      return res.status(403).json({
        message: 'Registration is restricted to authorized university email domains (@cuchd.in, @connect.cuchd.in).',
        code: 'DOMAIN_NOT_ALLOWED'
      });
    }

    // Check if an account already exists
    const existing = await findUserByEmail(normalizedEmail);
    if (existing && existing.isVerified) {
      return res.status(409).json({
        message: 'An active student account with this email already exists. Please log in.',
        code: 'ACCOUNT_EXISTS'
      });
    }

    // If password and name provided, store pending registration credentials
    if (password || name) {
      const trimmedName = (name || '').trim();
      if (trimmedName && trimmedName.length < 2) {
        return res.status(400).json({ message: 'Full name must be at least 2 characters' });
      }

      if (password && password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

      if (existing && !existing.isVerified) {
        // Update credentials of previously unverified registration
        if (hashedPassword) {
          await updateUnverifiedUser(normalizedEmail, {
            name: trimmedName || existing.name,
            password: hashedPassword
          });
        }
      } else if (hashedPassword) {
        // Create new pending unverified student record
        await createUser({
          email: normalizedEmail,
          password: hashedPassword,
          name: trimmedName,
          profile: { name: trimmedName },
          isVerified: false
        });
      }
    }

    // Generate cryptographically secure OTP and dispatch via real email provider
    const otpResult = await requestEmailOtp(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${normalizedEmail}`,
      email: normalizedEmail,
      expiresInMinutes: otpResult.expiresInMinutes,
      resendCooldownSeconds: otpResult.resendCooldownSeconds
    });
  } catch (err) {
    if (err.statusCode === 429) {
      return res.status(429).json({ message: err.message, retryAfter: err.retryAfter });
    }
    console.error('Registration/OTP dispatch error:', err.message);
    return res.status(500).json({
      message: err.message.includes('Email delivery service is not configured')
        ? err.message
        : 'Failed to dispatch verification email. Please check your address or contact support.'
    });
  }
};

/**
 * POST /api/auth/verify-email (and alias /api/auth/verify-otp, /api/auth/signup)
 * Validate 6-digit OTP, mark account verified, and issue authentication token.
 */
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp, password, name } = req.body || {};

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit verification code are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit verification code' });
    }

    // Verify 6-digit Keyed HMAC OTP code
    const otpCheck = await verifyEmailOtp(normalizedEmail, cleanOtp);
    if (!otpCheck.valid) {
      return res.status(400).json({
        message: otpCheck.error || 'Invalid or expired verification code'
      });
    }

    // Locate user record or create verified record (support legacy payload where password was submitted with OTP)
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      if (password && name) {
        const hashedPassword = await bcrypt.hash(password, 12);
        user = await createUser({
          email: normalizedEmail,
          password: hashedPassword,
          name: name.trim(),
          profile: { name: name.trim() },
          isVerified: true
        });
      } else {
        return res.status(404).json({
          message: 'Registration record not found. Please restart registration.'
        });
      }
    } else {
      // Mark existing user as verified
      user = await markUserVerifiedByEmail(normalizedEmail);
    }

    // Issue JWT authentication token
    const token = createToken(user.id);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token,
      profileComplete: user.profileComplete,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        profileComplete: user.profileComplete
      }
    });
  } catch (err) {
    console.error('Email verification error:', err.message);
    return res.status(500).json({ message: 'Verification failed — please try again' });
  }
};

/**
 * POST /api/auth/resend-verification (and alias /api/auth/resend-otp)
 * Re-issue fresh 6-digit OTP code enforcing 60-second cooldown and attempt limits.
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'University email address is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (user && user.isVerified) {
      return res.status(400).json({
        message: 'This account has already been verified. Please log in.',
        code: 'ALREADY_VERIFIED'
      });
    }

    const otpResult = await resendEmailOtp(normalizedEmail);

    return res.status(200).json({
      success: true,
      message: `A fresh 6-digit verification code has been dispatched to ${normalizedEmail}`,
      expiresInMinutes: otpResult.expiresInMinutes,
      resendCooldownSeconds: otpResult.resendCooldownSeconds
    });
  } catch (err) {
    if (err.statusCode === 429) {
      return res.status(429).json({ message: err.message, retryAfter: err.retryAfter });
    }
    console.error('Resend verification error:', err.message);
    return res.status(500).json({ message: err.message || 'Unable to resend verification code' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate student and verify that email address has been verified.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail, true);

    // Constant-time check to prevent timing enumeration
    const dummyHash = '$2b$12$invaliddummyhashingnobodycanmatchthisstring00000000000000';
    const passwordToCheck = user?.password || dummyHash;
    const match = await bcrypt.compare(password, passwordToCheck);

    if (!user || !match) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    // Enforce that unverified accounts cannot sign in
    if (user.isVerified === false) {
      return res.status(403).json({
        message: 'Your email address has not been verified yet. Please enter the verification code sent to your inbox.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      });
    }

    const token = createToken(user.id);
    return res.json({
      token,
      profileComplete: user.profileComplete,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isVerified: true,
        profileComplete: user.profileComplete
      }
    });
  } catch (err) {
    console.error('login error:', err.message);
    return res.status(500).json({ message: 'Login failed — please try again' });
  }
};

// Aliases for backwards compatibility with earlier frontend/API calls
export const sendSignupOtp = register;
export const signup = verifyEmail;
