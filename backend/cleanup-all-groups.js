/**
 * Cleanup Script: Delete All Groups
 * 
 * This script deletes all groups from the database.
 * Use with caution - this cannot be undone!
 * 
 * Usage: node cleanup-all-groups.js
 */

import { query } from './src/config/database.js';
import { initializeDatabase } from './src/models/database.js';

async function cleanupAllGroups() {
  try {
    console.log('[Cleanup] Initializing database connection...');
    await initializeDatabase();
    
    console.log('[Cleanup] Fetching all groups...');
    const groupsResult = await query('SELECT id, name, owner_address FROM groups');
    const groups = groupsResult.rows;
    
    console.log(`[Cleanup] Found ${groups.length} groups to delete:`);
    groups.forEach((g, i) => {
      console.log(`  ${i + 1}. ${g.name} (ID: ${g.id}, Owner: ${g.owner_address})`);
    });
    
    if (groups.length === 0) {
      console.log('[Cleanup] No groups to delete. Database is already clean.');
      process.exit(0);
    }
    
    console.log('\n[Cleanup] Deleting all groups...');
    
    // Delete all groups (CASCADE will automatically delete members and messages)
    const deleteResult = await query('DELETE FROM groups');
    console.log(`[Cleanup] Deleted ${deleteResult.rowCount} groups`);
    
    // Verify deletion
    const verifyResult = await query('SELECT COUNT(*) as count FROM groups');
    const remainingCount = parseInt(verifyResult.rows[0].count);
    
    if (remainingCount === 0) {
      console.log('[Cleanup] ✅ Success! All groups have been deleted.');
      console.log('[Cleanup] Related records (members and messages) were also deleted due to CASCADE.');
    } else {
      console.log(`[Cleanup] ⚠️  Warning: ${remainingCount} groups still remain in the database.`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Cleanup] ❌ Error:', error);
    console.error('[Cleanup] Stack:', error.stack);
    process.exit(1);
  }
}

// Run the cleanup
cleanupAllGroups();

