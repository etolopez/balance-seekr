import { query } from '../config/database.js';
import { updateGroupMemberCount } from './database.js';

/**
 * Get all public groups
 */
export async function getPublicGroups() {
  const result = await query(
    `SELECT 
      g.*,
      u.username as owner_username
     FROM groups g
     LEFT JOIN users u ON g.owner_address = u.wallet_address
     WHERE g.is_public = true
     ORDER BY g.created_at DESC`
  );
  return result.rows;
}

/**
 * Get group by ID
 */
export async function getGroupById(groupId) {
  const result = await query(
    `SELECT 
      g.*,
      u.username as owner_username
     FROM groups g
     LEFT JOIN users u ON g.owner_address = u.wallet_address
     WHERE g.id = $1`,
    [groupId]
  );
  return result.rows[0] || null;
}

/**
 * Create a new group
 */
export async function createGroup(groupData) {
  const result = await query(
    `INSERT INTO groups (
      name, owner_address, owner_username, is_public, join_price, 
      payment_address, description, create_price, create_payment_signature
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      groupData.name,
      groupData.ownerAddress,
      groupData.ownerUsername || null,
      true, // is_public
      groupData.joinPrice || 0,
      groupData.paymentAddress,
      groupData.description || null,
      groupData.createPrice,
      groupData.createPaymentSignature || null,
    ]
  );
  return result.rows[0];
}

/**
 * Check if user is a member of a group
 */
export async function isGroupMember(groupId, userAddress) {
  const result = await query(
    `SELECT COUNT(*) as count FROM group_members 
     WHERE group_id = $1 AND user_address = $2`,
    [groupId, userAddress]
  );
  return parseInt(result.rows[0].count) > 0;
}

/**
 * Add member to group
 */
export async function addGroupMember(groupId, userAddress, username, paymentSignature, joinPricePaid = 0) {
  const result = await query(
    `INSERT INTO group_members (group_id, user_address, username, join_payment_signature, join_price_paid)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (group_id, user_address) DO UPDATE SET
       join_payment_signature = EXCLUDED.join_payment_signature,
       join_price_paid = EXCLUDED.join_price_paid,
       joined_at = NOW()
     RETURNING *`,
    [groupId, userAddress, username || null, paymentSignature || null, joinPricePaid]
  );

  // Update member count
  await updateGroupMemberCount(groupId);

  return result.rows[0];
}

/**
 * Update group join price
 */
export async function updateGroupJoinPrice(groupId, newJoinPrice) {
  const result = await query(
    `UPDATE groups SET join_price = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newJoinPrice, groupId]
  );
  return result.rows[0] || null;
}

