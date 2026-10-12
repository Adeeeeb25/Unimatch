import express from 'express';
import { signup, login, sendSignupOtp } from './authController.js';

const router = express.Router();
router.post('/send-otp', sendSignupOtp);
router.post('/signup', signup);
router.post('/login', login);

export default router;
