import express from 'express';
import { getUserByAddress, getUserByUsername, upsertUser, isUsernameAvailable } from '../models/user.js';
import { validateWalletAddress, validateUsername, validateRequired } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/users/:address
 * Get user profile by wallet address
 */
router.get('/:address', validateWalletAddress, async (req, res) => {
  try {
    const { address } = req.params;
    const user = await getUserByAddress(address);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      username: user.username,
      xHandle: user.x_handle,
      verified: user.x_verified || false,
    });
  } catch (error) {
    console.error('[Users] Error getting user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * GET /api/users/username/check?username=...
 * Check if username is available
 */
router.get('/username/check', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is required' 
      });
    }

    // Validate format
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        available: false, 
        message: 'Username must be between 3 and 20 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        available: false, 
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    const available = await isUsernameAvailable(username);

    res.json({
      available,
      message: available ? 'Username is available' : 'Username is already taken',
    });
  } catch (error) {
    console.error('[Users] Error checking username:', error);
    res.status(500).json({ 
      available: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * POST /api/users/username
 * Register username for a wallet address
 */
router.post('/username', 
  validateRequired(['userAddress', 'username']),
  validateWalletAddress,
  validateUsername,
  async (req, res) => {
    try {
      const { userAddress, username } = req.body;

      // Check if user already has a username set
      const existingUser = await getUserByAddress(userAddress);
      if (existingUser && existingUser.username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username cannot be changed once set' 
        });
      }

      // Check if username is available
      const available = await isUsernameAvailable(username);
      if (!available) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username is already taken' 
        });
      }

      // Register username
      const user = await upsertUser(userAddress, {
        username,
        username_set_at: new Date(),
      });

      res.json({
        success: true,
        username: user.username,
        message: 'Username registered successfully',
      });
    } catch (error) {
      console.error('[Users] Error registering username:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

/**
 * POST /api/users/x-sync
 * Sync X (Twitter) account for verified badge
 */
router.post('/x-sync',
  validateRequired(['userAddress', 'xHandle']),
  validateWalletAddress,
  async (req, res) => {
    try {
      const { userAddress, xHandle, verificationToken } = req.body;

      // Clean handle (remove @ if present)
      const cleanHandle = xHandle.replace(/^@/, '');

      // TODO: Implement actual X/Twitter verification
      // For now, we'll just store the handle
      // In production, you would:
      // 1. Verify the user owns the X account
      // 2. Check if they posted a verification message
      // 3. Use Twitter API to verify ownership

      const user = await upsertUser(userAddress, {
        x_handle: cleanHandle,
        x_verified: false, // Set to true after verification
        x_verified_at: null,
      });

      res.json({
        success: true,
        verified: user.x_verified || false,
        message: 'X account synced. Verification pending.',
      });
    } catch (error) {
      console.error('[Users] Error syncing X account:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

export default router;

