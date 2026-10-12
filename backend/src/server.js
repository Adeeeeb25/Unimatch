import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './features/auth/authRoutes.js';
import userRoutes from './features/user/userRoutes.js';
import adminRoutes from './features/admin/adminRoutes.js';
import messageRoutes from './features/messages/messageRoutes.js';
import supportRoutes from './features/support/supportRoutes.js';
import domainRoutes from './features/domains/domainRoutes.js';

dotenv.config();

const app = express();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many inquiries submitted. Please try again later.' }
});

// CORS — restrict to configured origin in production
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

// Health check — reports DB connectivity
let dbReady = false;
connectDB().then(() => { dbReady = true; }).catch(() => { dbReady = false; });

app.get('/api/health', async (req, res) => {
  const status = dbReady ? 'ok' : 'degraded';
  res.status(dbReady ? 200 : 503).json({
    status,
    service: 'UniMatch API',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', authLimiter, adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/support', supportLimiter, supportRoutes);
app.use('/api/domains', domainRoutes);

// Global error handler
app.use((err, req, res, _next) => {
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ message: err.message });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'An unexpected server error occurred' });
});

const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`UniMatch API running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
