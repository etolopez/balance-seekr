import { query } from '../config/database.js';
import { updateGroupMemberCount } from './database.js';

/**
 * Get all public groups (optionally filtered by category)
 * @param {string} category - Optional category filter (Health, Financial, Personal Growth, Relationship)
 */
export async function getPublicGroups(category = null) {
  let queryText = `
    SELECT 
      g.*,
      u.username as owner_username
     FROM groups g
     LEFT JOIN users u ON g.owner_address = u.wallet_address
     WHERE g.is_public = true
  `;
  
  const params = [];
  if (category) {
    queryText += ` AND g.category = $1`;
    params.push(category);
  }
  
  queryText += ` ORDER BY g.created_at DESC`;
  
  const result = await query(queryText, params);
  
  // Debug: Log what we're returning
  console.log(`[Group Model] Query returned ${result.rows.length} groups${category ? ` for category "${category}"` : ' (all categories)'}:`, 
    result.rows.map(g => ({ id: g.id, name: g.name, category: g.category, owner_address: g.owner_address }))
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
  // Debug: Log what we're inserting
  console.log('[Group Model] Creating group with category:', {
    name: groupData.name,
    category: groupData.category,
    hasCategory: !!groupData.category
  });
  
  const result = await query(
    `INSERT INTO groups (
      name, owner_address, owner_username, is_public, join_price, 
      payment_address, description, create_price, create_payment_signature, background_image, category
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      groupData.backgroundImage || null,
      groupData.category || null,
    ]
  );
  
  // Debug: Log what was actually saved
  const created = result.rows[0];
  console.log('[Group Model] Group created, category in DB:', {
    id: created.id,
    name: created.name,
    category: created.category,
    categoryType: typeof created.category
  });
  
  return created;
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

/**
 * Delete a group (owner only)
 * @param {string} groupId - Group ID to delete
 * @param {string} ownerAddress - Address of the owner (for verification)
 * @returns {Promise<boolean>} True if deleted, false if not found or not owner
 */
export async function deleteGroup(groupId, ownerAddress) {
  try {
    // First verify the requester is the owner
    const group = await getGroupById(groupId);
    if (!group) {
      console.log(`[Group] Group not found: ${groupId}`);
      return false;
    }

    if (group.owner_address !== ownerAddress) {
      console.log(`[Group] Owner mismatch: expected ${group.owner_address}, got ${ownerAddress}`);
      throw new Error('Only the group owner can delete the group');
    }

    // Delete group (cascade will delete members and messages)
    // Note: PostgreSQL CASCADE will automatically delete related records
    console.log(`[Group] Attempting to delete group ${groupId} (owner: ${ownerAddress})`);
    const result = await query('DELETE FROM groups WHERE id = $1', [groupId]);
    console.log(`[Group] Delete query executed, rows affected: ${result.rowCount}`);
    
    if (result.rowCount === 0) {
      console.warn(`[Group] WARNING: Delete query affected 0 rows for group ${groupId}`);
    }
    
    // Verify deletion by trying to fetch the group
    const verifyGroup = await getGroupById(groupId);
    if (verifyGroup) {
      console.error(`[Group] ERROR: Group ${groupId} still exists after delete!`);
    } else {
      console.log(`[Group] Verified: Group ${groupId} successfully deleted`);
    }
    
    return result.rowCount > 0;
  } catch (error) {
    console.error('[Group] Error in deleteGroup:', error);
    throw error;
  }
}

/**
 * Update group background image
 */
export async function updateGroupBackgroundImage(groupId, backgroundImage, ownerAddress) {
  // Verify the requester is the owner
  const group = await getGroupById(groupId);
  if (!group) {
    return null;
  }
  
  if (group.owner_address !== ownerAddress) {
    throw new Error('Only the group owner can update the background image');
  }

  const result = await query(
    `UPDATE groups SET background_image = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [backgroundImage || null, groupId]
  );
  return result.rows[0] || null;
}

