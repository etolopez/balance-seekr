import { query } from '../config/database.js';

/**
 * Get messages for a group
 */
export async function getGroupMessages(groupId, limit = 100) {
  const result = await query(
    `SELECT 
      m.*,
      u.username as sender_username
     FROM messages m
     LEFT JOIN users u ON m.sender_address = u.wallet_address
     WHERE m.group_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2`,
    [groupId, limit]
  );
  return result.rows.reverse(); // Return in chronological order
}

/**
 * Create a new message
 */
export async function createMessage(groupId, senderAddress, content, senderUsername = null) {
  const result = await query(
    `INSERT INTO messages (group_id, sender_address, sender_username, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [groupId, senderAddress, senderUsername, content]
  );
  return result.rows[0];
}

