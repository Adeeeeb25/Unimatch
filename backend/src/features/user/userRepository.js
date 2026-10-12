import { pool, USERS_TABLE } from '../../config/db.js';

const mapUser = (row) => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  profileComplete: row.profile_complete,
  profile: row.profile || {},
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const buildSelect = (includePassword = false) =>
  includePassword
    ? `
      SELECT id, name, email, password, role, profile_complete, profile, created_at, updated_at
      FROM ${USERS_TABLE}
    `
    : `
      SELECT id, name, email, role, profile_complete, profile, created_at, updated_at
      FROM ${USERS_TABLE}
    `;

export const findUserByEmail = async (email, includePassword = false) => {
  const query = `${buildSelect(includePassword)} WHERE email = $1 LIMIT 1`;
  const result = await pool.query(query, [email]);
  if (!result.rows[0]) {
    return null;
  }

  const user = mapUser(result.rows[0]);
  if (includePassword) {
    user.password = result.rows[0].password;
  }
  return user;
};

export const findUserById = async (id, includePassword = false) => {
  const query = `${buildSelect(includePassword)} WHERE id = $1 LIMIT 1`;
  const result = await pool.query(query, [id]);
  if (!result.rows[0]) {
    return null;
  }

  const user = mapUser(result.rows[0]);
  if (includePassword) {
    user.password = result.rows[0].password;
  }
  return user;
};

export const createUser = async ({ email, password, name, profile = {} }) => {
  const result = await pool.query(
    `
      INSERT INTO ${USERS_TABLE} (email, password, name, profile)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, name, email, role, profile_complete, profile, created_at, updated_at
    `,
    [email, password, name, JSON.stringify(profile)]
  );

  return mapUser(result.rows[0]);
};

export const updateUserProfile = async (id, profile) => {
  const result = await pool.query(
    `
      UPDATE ${USERS_TABLE}
      SET profile = $2::jsonb,
          profile_complete = TRUE,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, role, profile_complete, profile, created_at, updated_at
    `,
    [id, JSON.stringify(profile)]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
};

export const deleteUserById = async (id) => {
  const result = await pool.query(`DELETE FROM ${USERS_TABLE} WHERE id = $1`, [id]);
  return result.rowCount > 0;
};

export const listAllUsers = async () => {
  const result = await pool.query(
    `SELECT id, name, email, role, profile_complete, profile, created_at, updated_at FROM ${USERS_TABLE} ORDER BY created_at DESC`
  );

  return result.rows.map(mapUser);
};
