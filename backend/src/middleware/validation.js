/**
 * Validate wallet address format
 * Checks both req.body and req.params for wallet addresses
 */
export function validateWalletAddress(req, res, next) {
  // Check req.body first (for POST/PUT requests)
  const { userAddress, ownerAddress, senderAddress } = req.body;
  let address = userAddress || ownerAddress || senderAddress;
  
  // If not in body, check req.params (for GET requests with :address param)
  if (!address && req.params && req.params.address) {
    address = req.params.address;
  }

  // Only validate if address is present
  if (address) {
    // Solana addresses are base58 encoded, 32-44 characters
    // Regex: no 0, O, I, l (base58 alphabet)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      console.error('[Validation] Invalid wallet address format:', {
        address: address?.substring(0, 10) + '...',
        length: address?.length,
        method: req.method,
        path: req.path
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid wallet address format' 
      });
    }
  }

  next();
}

/**
 * Validate username format
 */
export function validateUsername(req, res, next) {
  const { username } = req.body;

  if (username) {
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be between 3 and 20 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }
  }

  next();
}

/**
 * Validate required fields
 */
export function validateRequired(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
    }

    next();
  };
}

