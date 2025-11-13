import express from 'express';
import { 
  getPublicGroups, 
  getGroupById, 
  createGroup, 
  isGroupMember, 
  addGroupMember,
  updateGroupJoinPrice,
  updateGroupBackgroundImage
} from '../models/group.js';
import { verifyPayment } from '../config/solana.js';
import { validateWalletAddress, validateRequired } from '../middleware/validation.js';
import { getUserByAddress } from '../models/user.js';

const router = express.Router();

/**
 * GET /api/groups/public
 * Get all public groups
 */
router.get('/public', async (req, res) => {
  try {
    const groups = await getPublicGroups();
    res.json({ groups });
  } catch (error) {
    console.error('[Groups] Error fetching public groups:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * POST /api/groups
 * Create a new public group
 */
router.post('/',
  validateRequired(['name', 'ownerAddress', 'joinPrice', 'paymentAddress', 'createPrice', 'createPaymentSignature']),
  validateWalletAddress,
  async (req, res) => {
    try {
      const {
        name,
        ownerAddress,
        ownerUsername,
        joinPrice,
        paymentAddress,
        description,
        createPrice,
        createPaymentSignature,
      } = req.body;

      // Verify creation payment
      const PLATFORM_PAYMENT_ADDRESS = process.env.PLATFORM_PAYMENT_ADDRESS;
      if (!PLATFORM_PAYMENT_ADDRESS) {
        return res.status(500).json({ 
          success: false, 
          message: 'Platform payment address not configured' 
        });
      }

      // Verify payment with retry (RPC nodes may need time to index)
      // Use exponential backoff to avoid rate limiting
      let paymentValid = false;
      const maxRetries = 5; // Increased retries
      const baseDelay = 3000; // Start with 3 seconds
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[Groups] Payment verification attempt ${attempt}/${maxRetries}`);
        
        try {
          paymentValid = await verifyPayment(
            createPaymentSignature,
            PLATFORM_PAYMENT_ADDRESS,
            parseFloat(createPrice)
          );
          
          if (paymentValid) {
            console.log('[Groups] Payment verified successfully');
            break;
          }
        } catch (error) {
          // Check if it's a rate limit error
          const errorMsg = error?.message || String(error);
          if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
            console.warn(`[Groups] Rate limited on attempt ${attempt}, using longer backoff...`);
            // Use longer delay for rate limits
            const rateLimitDelay = baseDelay * Math.pow(2, attempt) * 2; // Exponential backoff with extra multiplier
            if (attempt < maxRetries) {
              console.log(`[Groups] Waiting ${rateLimitDelay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, rateLimitDelay));
              continue; // Retry without counting this as a failed attempt
            }
          }
          // For other errors, log and continue with normal retry
          console.error(`[Groups] Payment verification error on attempt ${attempt}:`, error?.message);
        }
        
        if (!paymentValid && attempt < maxRetries) {
          // Exponential backoff: 3s, 6s, 12s, 24s
          const retryDelay = baseDelay * Math.pow(2, attempt - 1);
          console.log(`[Groups] Payment verification failed, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      if (!paymentValid) {
        console.error('[Groups] Payment verification failed after all retries');
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or insufficient payment for group creation. Please check the transaction signature and ensure the payment was successful.' 
        });
      }

      // Get owner username if not provided
      let finalOwnerUsername = ownerUsername;
      if (!finalOwnerUsername) {
        const owner = await getUserByAddress(ownerAddress);
        finalOwnerUsername = owner?.username || null;
      }

      // Create group
      const group = await createGroup({
        name,
        ownerAddress,
        ownerUsername: finalOwnerUsername,
        joinPrice: parseFloat(joinPrice),
        paymentAddress,
        description,
        createPrice: parseFloat(createPrice),
        createPaymentSignature,
        backgroundImage: req.body.backgroundImage || null,
      });

      res.json({ group });
    } catch (error) {
      console.error('[Groups] Error creating group:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

/**
 * POST /api/groups/:groupId/join
 * Join a public group
 */
router.post('/:groupId/join',
  validateRequired(['userAddress', 'paymentSignature']),
  validateWalletAddress,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { userAddress, username, paymentSignature } = req.body;

      // Get group
      const group = await getGroupById(groupId);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found' 
        });
      }

      // Check if already a member
      const isMember = await isGroupMember(groupId, userAddress);
      if (isMember) {
        return res.json({ 
          success: true, 
          message: 'Already a member of this group' 
        });
      }

      // If group requires payment, verify it
      if (group.join_price > 0 && paymentSignature !== 'free') {
        const paymentValid = await verifyPayment(
          paymentSignature,
          group.payment_address,
          parseFloat(group.join_price)
        );

        if (!paymentValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid or insufficient payment to join group' 
          });
        }
      }

      // Get user username if not provided
      let finalUsername = username;
      if (!finalUsername) {
        const user = await getUserByAddress(userAddress);
        finalUsername = user?.username || null;
      }

      // Add member
      await addGroupMember(
        groupId,
        userAddress,
        finalUsername,
        paymentSignature === 'free' ? null : paymentSignature,
        parseFloat(group.join_price)
      );

      res.json({ 
        success: true, 
        message: 'Successfully joined group' 
      });
    } catch (error) {
      console.error('[Groups] Error joining group:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

/**
 * GET /api/groups/:groupId/members/:address
 * Check if user is a member of a group
 */
router.get('/:groupId/members/:address', validateWalletAddress, async (req, res) => {
  try {
    const { groupId, address } = req.params;
    const isMember = await isGroupMember(groupId, address);
    res.json({ isMember });
  } catch (error) {
    console.error('[Groups] Error checking membership:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

/**
 * PATCH /api/groups/:groupId/join-price
 * Update group join price (owner only)
 */
router.patch('/:groupId/join-price',
  validateRequired(['newJoinPrice']),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { newJoinPrice } = req.body;

      const group = await updateGroupJoinPrice(groupId, parseFloat(newJoinPrice));
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found' 
        });
      }

      res.json({ 
        success: true, 
        group,
        message: 'Join price updated successfully' 
      });
    } catch (error) {
      console.error('[Groups] Error updating join price:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

/**
 * PATCH /api/groups/:groupId/background-image
 * Update group background image (owner only)
 * backgroundImage can be null to remove the image
 */
router.patch('/:groupId/background-image',
  validateRequired(['ownerAddress']), // Only ownerAddress is required, backgroundImage can be null
  validateWalletAddress,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { ownerAddress, backgroundImage } = req.body;
      
      // Allow backgroundImage to be null, undefined, or a string
      // If not provided, default to null (removes image)
      const imageUrl = backgroundImage !== undefined ? backgroundImage : null;

      const group = await updateGroupBackgroundImage(groupId, imageUrl, ownerAddress);
      if (!group) {
        return res.status(404).json({ 
          success: false, 
          message: 'Group not found or you are not the owner' 
        });
      }

      res.json({ 
        success: true, 
        group,
        message: 'Background image updated successfully' 
      });
    } catch (error) {
      console.error('[Groups] Error updating background image:', error);
      if (error.message?.includes('owner')) {
        return res.status(403).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
);

export default router;

