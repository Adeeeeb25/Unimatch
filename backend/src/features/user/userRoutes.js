import express from 'express';
import {
	getProfile,
	updateProfile,
	deleteAccount,
	listUsers,
	deleteUserByAdmin,
	createUserByAdmin,
	getRecommendations,
	getPublicProfileById
} from './userController.js';
import { protect, requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.delete('/me', protect, deleteAccount);
router.get('/recommendations', protect, getRecommendations);
router.get('/:id/public', protect, getPublicProfileById);
router.get('/admin/users', protect, requireAdmin, listUsers);
router.post('/admin/users', protect, requireAdmin, createUserByAdmin);
router.delete('/admin/users/:id', protect, requireAdmin, deleteUserByAdmin);

export default router;
