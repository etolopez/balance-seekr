# Public Masterminds Setup Guide

## Overview
This document explains how to set up the public Masterminds feature with Solana payments.

## Architecture

### Components Created:
1. **PaymentService** (`src/services/payment.service.ts`)
   - Handles Solana payment transactions
   - Supports paying to create groups and joining groups
   - Verifies payment transactions

2. **ApiService** (`src/services/api.service.ts`)
   - Communicates with backend API for public groups
   - Manages public group creation, joining, and messaging
   - Handles payment verification on the backend

### Database Changes:
- Added fields to `mastermind_groups` table:
  - `isPublic` (INTEGER) - Whether group is public
  - `joinPrice` (REAL) - SOL amount to join
  - `paymentAddress` (TEXT) - Address to receive payments
  - `description` (TEXT) - Group description
  - `apiGroupId` (TEXT) - ID from backend API

### Store Updates:
- Added `publicGroups` array for public groups from API
- Added `createPublicGroup()` method
- Added `joinPublicGroup()` method
- Added `fetchPublicGroups()` method

## Backend API Requirements

You need to create a backend API with the following endpoints:

### Base URL
Set `EXPO_PUBLIC_API_URL` environment variable to your API URL (default: `https://api.solanaseeker.app`)

### Endpoints:

1. **GET /api/groups/public**
   - Returns list of all public groups
   - Response: `{ groups: PublicGroup[] }`

2. **POST /api/groups**
   - Creates a new public group
   - Body: `CreatePublicGroupRequest`
   - Response: `{ group: PublicGroup }`

3. **POST /api/groups/:groupId/join**
   - Joins a public group (verifies payment)
   - Body: `{ userAddress: string, username?: string, paymentSignature: string }`
   - Response: `{ success: boolean, message?: string }`

4. **GET /api/groups/:groupId/messages**
   - Gets messages for a public group
   - Response: `{ messages: PublicMessage[] }`

5. **POST /api/groups/:groupId/messages**
   - Sends a message to a public group
   - Body: `{ senderAddress: string, content: string, username?: string }`
   - Response: `{ message: PublicMessage }`

6. **GET /api/groups/:groupId/members/:userAddress**
   - Checks if user is a member
   - Response: `{ isMember: boolean }`

## Payment Flow

### Creating a Public Group:
1. User enters group name, join price, payment address, and description
2. User clicks "Create Public Group"
3. App calls `createPublicGroup()` which:
   - Creates group on backend API
   - Saves to local database
   - No payment required for creation (can be added later)

### Joining a Public Group:
1. User browses public groups
2. User selects a group to join
3. App shows join price
4. User confirms payment
5. App calls `PaymentService.payToJoinGroup()` to create transaction
6. User signs transaction in wallet
7. App calls `joinPublicGroup()` with payment signature
8. Backend verifies payment and adds user to group

## Next Steps

1. **Set up Backend API**: Create the API endpoints listed above
2. **Configure API URL**: Set `EXPO_PUBLIC_API_URL` in your environment
3. **Update UI**: The groups page UI needs to be updated to:
   - Show option to create public vs private groups
   - Display public groups list
   - Allow joining public groups with payment
4. **Payment Address**: Decide on payment address strategy:
   - Platform address (you receive all payments)
   - Group owner address (creators receive payments)
   - Split between platform and creator

## Testing

For testing without a backend:
- The app will gracefully handle API errors
- Public groups will show empty list
- Local groups will continue to work

## Security Considerations

1. **Payment Verification**: Backend must verify payment signatures on-chain
2. **Access Control**: Backend must check membership before allowing messages
3. **Rate Limiting**: Implement rate limiting on API endpoints
4. **Input Validation**: Validate all user inputs on backend

