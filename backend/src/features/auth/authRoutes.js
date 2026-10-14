import express from 'express';
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  sendSignupOtp,
  signup
} from './authController.js';

const router = express.Router();

// Primary standard endpoints
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/login', login);

// Aliases for seamless compatibility
router.post('/send-otp', sendSignupOtp);
router.post('/verify-otp', verifyEmail);
router.post('/signup', signup);
router.post('/resend-otp', resendVerification);

export default router;
