import { Router } from 'express';
import { protect, requireAdmin } from '../../middleware/authMiddleware.js';
import {
  submitSupportRequest,
  getSupportRequests,
  patchSupportStatus
} from './supportController.js';

const router = Router();

// Public submission: students or users can submit an inquiry without prior login
router.post('/', submitSupportRequest);

// Admin only: list and update support requests
router.get('/', protect, requireAdmin, getSupportRequests);
router.patch('/:id/status', protect, requireAdmin, patchSupportStatus);

export default router;
