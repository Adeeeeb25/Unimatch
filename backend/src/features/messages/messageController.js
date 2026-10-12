import {
  createMessage,
  getConversationMessages,
  getRecentConversations,
  markMessagesAsRead
} from './messageRepository.js';
import { findUserById } from '../user/userRepository.js';

export const sendDirectMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    if (String(senderId) === String(recipientId)) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    const recipient = await findUserById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient student not found' });
    }

    const message = await createMessage({
      senderId,
      recipientId,
      content: content.trim()
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('sendDirectMessage error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { partnerId } = req.params;

    const partner = await findUserById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await getConversationMessages(currentUserId, partnerId);
    // Mark incoming unread messages as read
    await markMessagesAsRead(currentUserId, partnerId);

    res.json({
      partner: {
        id: String(partner.id),
        name: partner.name,
        email: partner.email,
        profile: partner.profile || {}
      },
      messages
    });
  } catch (err) {
    console.error('getConversation error:', err);
    res.status(500).json({ message: 'Failed to load conversation' });
  }
};

export const listConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const conversations = await getRecentConversations(currentUserId);
    res.json({ conversations });
  } catch (err) {
    console.error('listConversations error:', err);
    res.status(500).json({ message: 'Failed to load conversations' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { partnerId } = req.params;
    const updatedCount = await markMessagesAsRead(currentUserId, partnerId);
    res.json({ updatedCount });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
};
