import { pool, SUPPORT_TABLE } from '../../config/db.js';

export const createSupportRequest = async ({ name, email, topic, message }) => {
  const result = await pool.query(
    `INSERT INTO ${SUPPORT_TABLE} (name, email, topic, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, topic, message, status, submitted_at`,
    [name.trim(), email.trim().toLowerCase(), topic, message.trim()]
  );
  return result.rows[0];
};

export const listSupportRequests = async ({ status } = {}) => {
  const conditions = status ? `WHERE status = $1` : '';
  const params = status ? [status] : [];
  const result = await pool.query(
    `SELECT id, name, email, topic, message, status, submitted_at, updated_at
     FROM ${SUPPORT_TABLE}
     ${conditions}
     ORDER BY submitted_at DESC
     LIMIT 200`,
    params
  );
  return result.rows;
};

export const updateSupportStatus = async (id, status) => {
  const allowed = ['open', 'in_progress', 'resolved', 'closed'];
  if (!allowed.includes(status)) throw new Error('Invalid status value');
  const result = await pool.query(
    `UPDATE ${SUPPORT_TABLE} SET status = $1, updated_at = NOW() WHERE id = $2
     RETURNING id, status, updated_at`,
    [status, id]
  );
  return result.rows[0] || null;
};
