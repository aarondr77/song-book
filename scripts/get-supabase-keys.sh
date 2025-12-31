#!/bin/bash

echo "🔑 Getting Supabase Credentials"
echo "================================"
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
elif npm list supabase &> /dev/null; then
    SUPABASE_CMD="npx supabase"
else
    echo "❌ Supabase CLI not found"
    echo "   Install it with: npm install supabase"
    exit 1
fi

# Get Supabase status
echo "Fetching Supabase status..."
STATUS=$($SUPABASE_CMD status 2>/dev/null)

if [ -z "$STATUS" ]; then
    echo "❌ Supabase is not running"
    echo ""
    echo "   Start it with:"
    echo "   npm run supabase:start"
    echo ""
    exit 1
fi

echo ""
echo "📋 Supabase Credentials:"
echo ""

# Extract API URL
API_URL=$(echo "$STATUS" | grep "API URL" | awk '{print $3}')
if [ -n "$API_URL" ]; then
    echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL"
fi

# Extract anon key
ANON_KEY=$(echo "$STATUS" | grep -A 1 "anon key" | tail -1 | xargs)
if [ -n "$ANON_KEY" ]; then
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
fi

echo ""
echo "📝 Add these to your .env.local file"
echo ""

