#!/bin/bash

# Backend API Testing Script
# Usage: ./test-api.sh [base_url]
# Example: ./test-api.sh https://your-app.railway.app
#          ./test-api.sh http://localhost:3000

BASE_URL="${1:-http://localhost:3000}"
WALLET_ADDRESS="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
USERNAME="testuser$(date +%s)"

echo "🧪 Testing Backend API"
echo "Base URL: $BASE_URL"
echo "Wallet Address: $WALLET_ADDRESS"
echo "Username: $USERNAME"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "ok"; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
  echo -e "${RED}❌ Health check failed${NC}"
  echo "$HEALTH"
  exit 1
fi

# Test 2: Check Username Availability
echo -e "\n${YELLOW}Test 2: Check Username Availability${NC}"
AVAILABILITY=$(curl -s "$BASE_URL/api/users/username/check?username=$USERNAME")
if echo "$AVAILABILITY" | grep -q "available"; then
  echo -e "${GREEN}✅ Username check passed${NC}"
  echo "$AVAILABILITY" | jq '.' 2>/dev/null || echo "$AVAILABILITY"
else
  echo -e "${RED}❌ Username check failed${NC}"
  echo "$AVAILABILITY"
fi

# Test 3: Register Username
echo -e "\n${YELLOW}Test 3: Register Username${NC}"
REGISTER=$(curl -s -X POST "$BASE_URL/api/users/username" \
  -H "Content-Type: application/json" \
  -d "{\"userAddress\": \"$WALLET_ADDRESS\", \"username\": \"$USERNAME\"}")
if echo "$REGISTER" | grep -q "success"; then
  echo -e "${GREEN}✅ Username registration passed${NC}"
  echo "$REGISTER" | jq '.' 2>/dev/null || echo "$REGISTER"
else
  echo -e "${RED}❌ Username registration failed${NC}"
  echo "$REGISTER"
fi

# Test 4: Get User Profile
echo -e "\n${YELLOW}Test 4: Get User Profile${NC}"
PROFILE=$(curl -s "$BASE_URL/api/users/$WALLET_ADDRESS")
if [ ! -z "$PROFILE" ]; then
  echo -e "${GREEN}✅ Get profile passed${NC}"
  echo "$PROFILE" | jq '.' 2>/dev/null || echo "$PROFILE"
else
  echo -e "${RED}❌ Get profile failed${NC}"
  echo "$PROFILE"
fi

# Test 5: Get Public Groups
echo -e "\n${YELLOW}Test 5: Get Public Groups${NC}"
GROUPS=$(curl -s "$BASE_URL/api/groups/public")
if [ ! -z "$GROUPS" ]; then
  echo -e "${GREEN}✅ Get groups passed${NC}"
  echo "$GROUPS" | jq '.' 2>/dev/null || echo "$GROUPS"
else
  echo -e "${RED}❌ Get groups failed${NC}"
  echo "$GROUPS"
fi

echo -e "\n${GREEN}✅ Testing complete!${NC}"
echo ""
echo "To test creating a group, you'll need a valid payment signature."
echo "For now, you can test the endpoints manually using the examples in TESTING_GUIDE.md"

