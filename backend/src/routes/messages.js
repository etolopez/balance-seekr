import express from 'express';
import { getGroupMessages, createMessage } from '../models/message.js';
import { getGroupById, isGroupMember } from '../models/group.js';
import { getUserByAddress } from '../models/user.js';
import { validateRequired, validateWalletAddress } from '../middleware/validation.js';

const router = express.Router();

/**
 * GET /api/groups/:groupId/messages
 * Get messages for a group
 */
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    // Verify group exists
    const group = await getGroupById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Group not found' 
      });
    }

    const messages = await getGroupMessages(groupId, limit);
    res.json({ messages });
  } catch (error) {
    console.error('[Messages] Error fetching messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * POST /api/groups/:groupId/messages
 * Send a message to a group
 */
router.post('/:groupId',
  validateRequired(['senderAddress', 'content']),
  validateWalletAddress,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { senderAddress, content, username } = req.body;

      // Verify group exists
      const group = await getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found' 
        });
      }

      // Verify user is a member
      const isMember = await isGroupMember(groupId, senderAddress);
      if (!isMember) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be a member of this group to send messages' 
        });
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message content cannot be empty' 
        });
      }

      if (content.length > 5000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Message content is too long (max 5000 characters)' 
        });
      }

      // Get sender username if not provided
      let finalUsername = username;
      if (!finalUsername) {
        const user = await getUserByAddress(senderAddress);
        finalUsername = user?.username || null;
      }

      // Create message
      const message = await createMessage(
        groupId,
        senderAddress,
        content.trim(),
        finalUsername
      );

      res.json({ message });
    } catch (error) {
      console.error('[Messages] Error sending message:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

export default router;

