import jwt from 'jsonwebtoken';

const EXPIRATION = '7d';

export const createToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: EXPIRATION });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
