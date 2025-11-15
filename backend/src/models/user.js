import { query } from '../config/database.js';

/**
 * Get user by wallet address
 */
export async function getUserByAddress(walletAddress) {
  const result = await query(
    `SELECT * FROM users WHERE wallet_address = $1`,
    [walletAddress]
  );
  return result.rows[0] || null;
}

/**
 * Get user by username
 */
export async function getUserByUsername(username) {
  const result = await query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
}

/**
 * Get user by X handle
 */
export async function getUserByXHandle(xHandle) {
  const result = await query(
    `SELECT * FROM users WHERE x_handle = $1 AND x_handle IS NOT NULL`,
    [xHandle]
  );
  return result.rows[0] || null;
}

/**
 * Create or update user
 */
export async function upsertUser(walletAddress, data = {}) {
  const existing = await getUserByAddress(walletAddress);
  
  if (existing) {
    // Update existing user
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (data.username !== undefined) {
      updates.push(`username = $${paramIndex++}`);
      values.push(data.username);
    }
    if (data.username_set_at !== undefined) {
      updates.push(`username_set_at = $${paramIndex++}`);
      values.push(data.username_set_at);
    }
    if (data.x_handle !== undefined) {
      updates.push(`x_handle = $${paramIndex++}`);
      values.push(data.x_handle);
    }
    if (data.x_verified !== undefined) {
      updates.push(`x_verified = $${paramIndex++}`);
      values.push(data.x_verified);
    }
    if (data.x_verified_at !== undefined) {
      updates.push(`x_verified_at = $${paramIndex++}`);
      values.push(data.x_verified_at);
    }

    updates.push(`updated_at = NOW()`);
    values.push(walletAddress);

    if (updates.length > 1) {
      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE wallet_address = $${paramIndex}`,
        values
      );
    }

    return await getUserByAddress(walletAddress);
  } else {
    // Create new user
    const result = await query(
      `INSERT INTO users (wallet_address, username, username_set_at, x_handle, x_verified, x_verified_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        walletAddress,
        data.username || null,
        data.username ? new Date() : null,
        data.x_handle || null,
        data.x_verified || false,
        data.x_verified ? new Date() : null,
      ]
    );
    return result.rows[0];
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username) {
  const result = await query(
    `SELECT COUNT(*) as count FROM users WHERE username = $1`,
    [username]
  );
  return parseInt(result.rows[0].count) === 0;
}

