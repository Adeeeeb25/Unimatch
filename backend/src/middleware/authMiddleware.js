import jwt from 'jsonwebtoken';
import { findUserById } from '../features/user/userRepository.js';

// JWT verification for both students and administrators
export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const studentSecret = process.env.JWT_SECRET;
  const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

  let decoded;
  try {
    try {
      decoded = jwt.verify(token, studentSecret);
    } catch (primaryErr) {
      if (adminSecret && adminSecret !== studentSecret) {
        decoded = jwt.verify(token, adminSecret);
      } else {
        throw primaryErr;
      }
    }

    // Admin token path: JWT contains role:admin, no DB lookup needed
    if (decoded.role === 'admin') {
      req.user = {
        id: decoded.id,
        role: 'admin',
        name: 'Administrator',
        email: 'admin@unimatch.local'
      };
      return next();
    }

    // Student token path: lookup from database
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }

    if (user.isVerified === false) {
      return res.status(403).json({
        message: 'Email verification required. Please verify your student email address.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired — please sign in again' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access required' });
  }
  next();
};
