import { pool, MESSAGES_TABLE, USERS_TABLE } from '../../config/db.js';

const mapMessage = (row) => ({
  id: row.id,
  senderId: String(row.sender_id),
  recipientId: String(row.recipient_id),
  content: row.content,
  isRead: row.is_read,
  createdAt: row.created_at
});

export const createMessage = async ({ senderId, recipientId, content }) => {
  const result = await pool.query(
    `
      INSERT INTO ${MESSAGES_TABLE} (sender_id, recipient_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, sender_id, recipient_id, content, is_read, created_at
    `,
    [senderId, recipientId, content.trim()]
  );

  return mapMessage(result.rows[0]);
};

export const getConversationMessages = async (userId1, userId2) => {
  const result = await pool.query(
    `
      SELECT id, sender_id, recipient_id, content, is_read, created_at
      FROM ${MESSAGES_TABLE}
      WHERE (sender_id = $1 AND recipient_id = $2)
         OR (sender_id = $2 AND recipient_id = $1)
      ORDER BY created_at ASC
    `,
    [userId1, userId2]
  );

  return result.rows.map(mapMessage);
};

export const markMessagesAsRead = async (recipientId, senderId) => {
  const result = await pool.query(
    `
      UPDATE ${MESSAGES_TABLE}
      SET is_read = TRUE
      WHERE recipient_id = $1 AND sender_id = $2 AND is_read = FALSE
      RETURNING id
    `,
    [recipientId, senderId]
  );

  return result.rowCount;
};

export const getRecentConversations = async (userId) => {
  const query = `
    SELECT DISTINCT ON (partner_id)
      partner_id,
      u.name AS partner_name,
      u.email AS partner_email,
      u.profile AS partner_profile,
      m.content AS last_message,
      m.created_at AS last_message_at,
      m.sender_id AS last_sender_id,
      (
        SELECT COUNT(*)::int
        FROM ${MESSAGES_TABLE}
        WHERE recipient_id = $1 AND sender_id = partner_id AND is_read = FALSE
      ) AS unread_count
    FROM (
      SELECT
        CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS partner_id,
        id, content, created_at, sender_id
      FROM ${MESSAGES_TABLE}
      WHERE sender_id = $1 OR recipient_id = $1
    ) m
    JOIN ${USERS_TABLE} u ON u.id = m.partner_id
    ORDER BY partner_id, m.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows.map((row) => ({
    partnerId: String(row.partner_id),
    partnerName: row.partner_name,
    partnerEmail: row.partner_email,
    partnerProfile: row.partner_profile || {},
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    lastSenderId: String(row.last_sender_id),
    unreadCount: Number(row.unread_count || 0)
  }));
};
