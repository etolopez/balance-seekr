/**
 * Validate wallet address format
 */
export function validateWalletAddress(req, res, next) {
  const { userAddress, ownerAddress, senderAddress } = req.body;
  const address = userAddress || ownerAddress || senderAddress;

  if (address && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid wallet address format' 
    });
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

