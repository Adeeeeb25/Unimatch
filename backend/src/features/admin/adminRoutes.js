import express from 'express';
import { adminLogin } from './adminController.js';

const router = express.Router();

router.post('/login', adminLogin);

export default router;
