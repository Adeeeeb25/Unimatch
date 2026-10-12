import { pool, DOMAINS_TABLE } from '../../config/db.js';
import crypto from 'crypto';

const mapDomain = (row) => ({
  id: String(row.id),
  domain: row.domain,
  institution: row.institution,
  status: row.status,
  isPrimary: row.is_primary,
  verificationToken: row.verification_token,
  addedAt: row.added_at,
  verifiedAt: row.verified_at
});

export const listDomains = async () => {
  const result = await pool.query(
    `SELECT * FROM ${DOMAINS_TABLE} ORDER BY is_primary DESC, added_at ASC`
  );
  return result.rows.map(mapDomain);
};

export const findDomainByValue = async (domain) => {
  const result = await pool.query(
    `SELECT * FROM ${DOMAINS_TABLE} WHERE domain = $1 LIMIT 1`,
    [domain]
  );
  return result.rows[0] ? mapDomain(result.rows[0]) : null;
};

export const createDomain = async ({ domain, institution }) => {
  const verificationToken = `unimatch-verify=${crypto.randomBytes(16).toString('hex')}`;
  const result = await pool.query(
    `INSERT INTO ${DOMAINS_TABLE} (domain, institution, verification_token)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [domain, institution, verificationToken]
  );
  return mapDomain(result.rows[0]);
};

export const updateDomainStatus = async (id, status) => {
  const verifiedAt = status === 'verified' ? 'NOW()' : 'NULL';
  const result = await pool.query(
    `UPDATE ${DOMAINS_TABLE}
     SET status = $1, verified_at = ${verifiedAt}
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] ? mapDomain(result.rows[0]) : null;
};

export const setPrimaryDomain = async (id) => {
  // Unset all, then set the chosen one
  await pool.query(`UPDATE ${DOMAINS_TABLE} SET is_primary = FALSE`);
  const result = await pool.query(
    `UPDATE ${DOMAINS_TABLE} SET is_primary = TRUE WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] ? mapDomain(result.rows[0]) : null;
};

export const deleteDomain = async (id) => {
  const result = await pool.query(
    `DELETE FROM ${DOMAINS_TABLE} WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rowCount > 0;
};
