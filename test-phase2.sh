#!/bin/bash

# Phase 2 Features Test Script
# This script tests all the new Phase 2 features

API_URL="${API_URL:-http://localhost:3001}"
TELEGRAM_ID="${TELEGRAM_ID:-213966132}"

echo "🧪 Testing Travel Helper Phase 2 Features"
echo "API URL: $API_URL"
echo "Telegram ID: $TELEGRAM_ID"
echo ""

# Test 1: Health Check
echo "📍 Test 1: Health Check"
curl -s "$API_URL/health" | jq .
echo ""

# Test 2: Passport Management - GET (should return null initially)
echo "📍 Test 2: Get Passport (should be null initially)"
curl -s -X GET "$API_URL/api/user/passport" \
  -H "x-telegram-id: $TELEGRAM_ID" | jq .
echo ""

# Test 3: Passport Management - POST (create)
echo "📍 Test 3: Create Passport"
curl -s -X POST "$API_URL/api/user/passport" \
  -H "Content-Type: application/json" \
  -H "x-telegram-id: $TELEGRAM_ID" \
  -d '{
    "passportNo": "123456789",
    "fullName": "WANG, XIAO-MING",
    "dateOfBirth": "1990-01-15",
    "issueDate": "2020-01-01",
    "expiryDate": "2030-01-01",
    "issuingCountry": "TW"
  }' | jq .
echo ""

# Test 4: Passport Management - GET (should return passport)
echo "📍 Test 4: Get Passport (should return created passport)"
curl -s -X GET "$API_URL/api/user/passport" \
  -H "x-telegram-id: $TELEGRAM_ID" | jq .
echo ""

# Test 5: Prohibited Items Checker
echo "📍 Test 5: Check Prohibited Items for Japan"
curl -s -X POST "$API_URL/api/legal/JP/check" \
  -H "Content-Type: application/json" \
  -d '{
    "items": ["感冒藥", "肉乾", "口香糖", "蘋果"]
  }' | jq .
echo ""

# Test 6: Policy Changes - GET
echo "📍 Test 6: Get Policy Changes"
curl -s "$API_URL/api/policy-changes?limit=5" | jq .
echo ""

# Test 7: Reminders Check
echo "📍 Test 7: Manual Passport Expiry Check"
curl -s -X POST "$API_URL/api/reminders/check" | jq .
echo ""

# Test 8: Notifications
echo "📍 Test 8: Get User Notifications"
curl -s -X GET "$API_URL/api/reminders/notifications" \
  -H "x-telegram-id: $TELEGRAM_ID" | jq .
echo ""

# Test 9: Passport Management - DELETE
echo "📍 Test 9: Delete Passport"
curl -s -X DELETE "$API_URL/api/user/passport" \
  -H "x-telegram-id: $TELEGRAM_ID" | jq .
echo ""

# Test 10: Verify deletion
echo "📍 Test 10: Verify Passport Deletion"
curl -s -X GET "$API_URL/api/user/passport" \
  -H "x-telegram-id: $TELEGRAM_ID" | jq .
echo ""

echo "✅ All tests completed!"
