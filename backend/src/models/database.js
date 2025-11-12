import { query } from '../config/database.js';

/**
 * Initialize database tables
 */
export async function initializeDatabase() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_address VARCHAR(44) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE,
        username_set_at TIMESTAMP,
        x_handle VARCHAR(100),
        x_verified BOOLEAN DEFAULT false,
        x_verified_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create index on username for faster lookups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);

    // Create index on wallet_address
    await query(`
      CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address)
    `);

    // Groups table
    await query(`
      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        owner_address VARCHAR(44) NOT NULL,
        owner_username VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_public BOOLEAN NOT NULL DEFAULT true,
        join_price DECIMAL(18, 9) NOT NULL DEFAULT 0,
        payment_address VARCHAR(44) NOT NULL,
        description TEXT,
        create_price DECIMAL(18, 9) NOT NULL,
        create_payment_signature VARCHAR(200),
        member_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for groups
    await query(`
      CREATE INDEX IF NOT EXISTS idx_groups_owner_address ON groups(owner_address)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC)
    `);

    // Group members table
    await query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        user_address VARCHAR(44) NOT NULL,
        username VARCHAR(100),
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        join_payment_signature VARCHAR(200),
        join_price_paid DECIMAL(18, 9) DEFAULT 0,
        UNIQUE(group_id, user_address)
      )
    `);

    // Create indexes for group_members
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_group_members_user_address ON group_members(user_address)
    `);

    // Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
        sender_address VARCHAR(44) NOT NULL,
        sender_username VARCHAR(100),
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for messages
    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id, created_at DESC)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_address ON messages(sender_address)
    `);

    console.log('[Database] Tables initialized successfully');
  } catch (error) {
    console.error('[Database] Error initializing tables:', error);
    throw error;
  }
}

/**
 * Update member count for a group
 */
export async function updateGroupMemberCount(groupId) {
  const result = await query(
    `SELECT COUNT(*) as count FROM group_members WHERE group_id = $1`,
    [groupId]
  );
  const count = parseInt(result.rows[0].count);
  
  await query(
    `UPDATE groups SET member_count = $1, updated_at = NOW() WHERE id = $2`,
    [count, groupId]
  );
  
  return count;
}

