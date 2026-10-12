import bcrypt from 'bcrypt';
import { createToken } from '../shared/tokenService.js';
import { createUser, findUserByEmail } from '../user/userRepository.js';

// Allowed email domains — comma-separated list in env, e.g. "connect.cuchd.in,cuchd.in"
// If not set, all email domains are accepted (development fallback).
const getAllowedDomains = () => {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS;
  if (!raw) return null; // null = unrestricted (dev mode)
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
};

const isEmailDomainAllowed = (email) => {
  const domains = getAllowedDomains();
  if (!domains) return true; // dev mode: all domains accepted
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return domains.some((allowed) => emailDomain === allowed || emailDomain?.endsWith(`.${allowed}`));
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Full name, email, and password are required' });
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (!isEmailDomainAllowed(normalizedEmail)) {
      return res.status(403).json({
        message: 'Registration is restricted to authorized university email addresses. Contact support if you believe your domain should be approved.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await createUser({
      email: normalizedEmail,
      password: hashed,
      name: trimmedName,
      profile: { name: trimmedName }
    });

    const token = createToken(user.id);
    return res.status(201).json({ token, profileComplete: user.profileComplete });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ message: 'Registration failed — please try again' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail, true);

    // Use constant-time comparison even when user not found to prevent timing attacks
    const dummyHash = '$2b$12$invaliddummyhashingnobodycanmatchthisstring00000000000000';
    const passwordToCheck = user?.password || dummyHash;
    const match = await bcrypt.compare(password, passwordToCheck);

    if (!user || !match) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    const token = createToken(user.id);
    return res.json({ token, profileComplete: user.profileComplete });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Login failed — please try again' });
  }
};
