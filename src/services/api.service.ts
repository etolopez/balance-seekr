/**
 * API Service - Handles communication with backend API for public Mastermind groups
 * This service manages public groups, messages, and payment verification
 */

export type PublicGroup = {
  id: string;
  name: string;
  ownerAddress: string;
  ownerUsername?: string;
  createdAt: string;
  isPublic: boolean;
  createPrice?: number; // SOL amount to create (if applicable)
  joinPrice: number; // SOL amount to join
  paymentAddress: string; // Address to receive payments
  memberCount?: number;
  description?: string;
};

export type PublicMessage = {
  id: string;
  groupId: string;
  senderAddress: string;
  senderUsername?: string;
  content: string;
  createdAt: string;
};

export type CreatePublicGroupRequest = {
  name: string;
  ownerAddress: string;
  ownerUsername?: string;
  joinPrice: number; // 0 for free groups
  paymentAddress: string; // Platform address for creation fee, or owner address for join payments
  description?: string;
  createPaymentSignature: string; // Transaction signature for platform creation fee (always required)
  createPrice: number; // Platform fee for creating a group (always required, even for free groups)
};

export type JoinGroupRequest = {
  groupId: string;
  userAddress: string;
  username?: string;
  paymentSignature: string; // Transaction signature for payment (contains both platform and owner payments)
  platformFeeSignature?: string; // Platform fee transaction signature (if separate)
  ownerPaymentSignature?: string; // Owner payment transaction signature (if separate)
};

export class ApiService {
  private baseUrl: string;

  constructor() {
    // TODO: Set this to your backend API URL
    // For now, using a placeholder that you'll need to configure
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.solanaseeker.app';
  }

  /**
   * Get all public Mastermind groups
   */
  async getPublicGroups(): Promise<PublicGroup[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/groups/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch public groups: ${response.statusText}`);
      }

      const data = await response.json();
      return data.groups || [];
    } catch (error: any) {
      // Silently handle network errors when backend is not available
      // This is expected during development when backend hasn't been set up yet
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        // Backend not available - this is expected, don't log as error
        console.log('[ApiService] Backend not available - public groups feature requires API setup');
      } else {
        console.error('[ApiService] Error fetching public groups:', error);
      }
      // Return empty array on error - allows app to work offline
      return [];
    }
  }

  /**
   * Create a new public Mastermind group
   */
  async createPublicGroup(request: CreatePublicGroupRequest): Promise<PublicGroup> {
    try {
      const response = await fetch(`${this.baseUrl}/api/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to create group: ${response.statusText}`);
      }

      const data = await response.json();
      return data.group;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Backend API is not available. Please set up the backend API first. See BACKEND_API_STRUCTURE.md for setup instructions.');
      }
      console.error('[ApiService] Error creating public group:', error);
      throw error;
    }
  }

  /**
   * Join a public Mastermind group (with payment verification)
   */
  async joinPublicGroup(request: JoinGroupRequest): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/groups/${request.groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: request.userAddress,
          username: request.username,
          paymentSignature: request.paymentSignature,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to join group: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Backend API is not available. Please set up the backend API first. See BACKEND_API_STRUCTURE.md for setup instructions.');
      }
      console.error('[ApiService] Error joining public group:', error);
      throw error;
    }
  }

  /**
   * Get messages for a public group
   */
  async getGroupMessages(groupId: string): Promise<PublicMessage[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/messages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        // Backend not available - return empty array silently
        return [];
      }
      console.error('[ApiService] Error fetching group messages:', error);
      return [];
    }
  }

  /**
   * Send a message to a public group
   */
  async sendMessage(groupId: string, senderAddress: string, content: string, username?: string): Promise<PublicMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderAddress,
          content,
          username,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('[ApiService] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Check if user is a member of a public group
   */
  async checkMembership(groupId: string, userAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/groups/${groupId}/members/${userAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isMember === true;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        // Backend not available - return false silently
        return false;
      }
      console.error('[ApiService] Error checking membership:', error);
      return false;
    }
  }

  /**
   * Register or update username for a wallet address
   * Username can only be set once and must be unique
   */
  async registerUsername(userAddress: string, username: string): Promise<{ success: boolean; message?: string; username?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          username,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to register username: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, username: data.username, message: data.message };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Backend API is not available. Please set up the backend API first. See BACKEND_API_STRUCTURE.md for setup instructions.');
      }
      console.error('[ApiService] Error registering username:', error);
      throw error;
    }
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/username/check?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to check username: ${response.statusText}`);
      }

      const data = await response.json();
      return { available: data.available === true, message: data.message };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Backend API is not available. Please set up the backend API first.');
      }
      console.error('[ApiService] Error checking username availability:', error);
      throw error;
    }
  }

  /**
   * Get user profile by wallet address
   */
  async getUserProfile(userAddress: string): Promise<{ username?: string; xHandle?: string; verified?: boolean } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${encodeURIComponent(userAddress)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        username: data.username,
        xHandle: data.xHandle,
        verified: data.verified === true,
      };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        // Backend not available - return null silently
        return null;
      }
      console.error('[ApiService] Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Sync X (Twitter) account for verified badge
   */
  async syncXAccount(userAddress: string, xHandle: string, verificationToken?: string): Promise<{ success: boolean; verified: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/x-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress,
          xHandle,
          verificationToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Failed to sync X account: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, verified: data.verified === true, message: data.message };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('Network request failed') || errorMsg.includes('Failed to fetch')) {
        throw new Error('Backend API is not available. Please set up the backend API first.');
      }
      console.error('[ApiService] Error syncing X account:', error);
      throw error;
    }
  }
}

