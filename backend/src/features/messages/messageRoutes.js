import { Router } from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import {
  getConversation,
  listConversations,
  markAsRead,
  sendDirectMessage
} from './messageController.js';

const router = Router();

router.use(protect);

router.get('/conversations', listConversations);
router.get('/:partnerId', getConversation);
router.post('/:recipientId', sendDirectMessage);
router.patch('/:partnerId/read', markAsRead);

export default router;
