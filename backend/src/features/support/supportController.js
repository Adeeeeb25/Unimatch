import {
  createSupportRequest,
  listSupportRequests,
  updateSupportStatus
} from './supportRepository.js';

const VALID_TOPICS = [
  'General question',
  'Custom domain request',
  'Account verification',
  'Report an issue',
  'Other'
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const submitSupportRequest = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({ message: 'Message cannot exceed 2000 characters' });
    }

    const resolvedTopic = VALID_TOPICS.includes(topic) ? topic : 'General question';

    const request = await createSupportRequest({
      name: name.trim(),
      email: email.trim(),
      topic: resolvedTopic,
      message: message.trim()
    });

    return res.status(201).json({
      id: request.id,
      message: 'Your support request has been submitted. Our team will respond within one business day.',
      submittedAt: request.submitted_at
    });
  } catch (err) {
    console.error('submitSupportRequest error:', err);
    return res.status(500).json({ message: 'Failed to submit support request — please try again' });
  }
};

export const getSupportRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const requests = await listSupportRequests({ status });
    return res.json({ count: requests.length, requests });
  } catch (err) {
    console.error('getSupportRequests error:', err);
    return res.status(500).json({ message: 'Failed to load support requests' });
  }
};

export const patchSupportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    const updated = await updateSupportStatus(id, status);
    if (!updated) {
      return res.status(404).json({ message: 'Support request not found' });
    }
    return res.json(updated);
  } catch (err) {
    if (err.message === 'Invalid status value') {
      return res.status(400).json({ message: err.message });
    }
    console.error('patchSupportStatus error:', err);
    return res.status(500).json({ message: 'Failed to update request status' });
  }
};
