import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

// Issue a proper signed JWT with role: admin
// The token is verified in authMiddleware using the same secret
export const adminLogin = async (req, res) => {
  try {
    const { id, password } = req.body || {};
    if (!id || !password) {
      return res.status(400).json({ message: 'Administrator ID and password are required' });
    }

    const adminId = process.env.ADMIN_ID;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminId || !adminPasswordHash) {
      return res.status(503).json({
        message: 'Administrator account not configured. Set ADMIN_ID and ADMIN_PASSWORD_HASH in the server environment.'
      });
    }

    if (id.trim() !== adminId) {
      return res.status(401).json({ message: 'Invalid administrator credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, adminPasswordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid administrator credentials' });
    }

    const token = jwt.sign(
      { id: `admin:${adminId}`, role: 'admin' },
      ADMIN_JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ token });
  } catch (err) {
    console.error('adminLogin error:', err);
    return res.status(500).json({ message: 'Authentication service error' });
  }
};
