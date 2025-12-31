#!/bin/bash

# Script to update .env.local with Supabase credentials

echo "🔧 Updating .env.local with Supabase credentials"
echo "================================================"
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
elif npm list supabase &> /dev/null; then
    SUPABASE_CMD="npx supabase"
else
    echo "❌ Supabase CLI not found"
    exit 1
fi

# Get Supabase status
STATUS=$($SUPABASE_CMD status 2>/dev/null)

if [ -z "$STATUS" ]; then
    echo "❌ Supabase is not running"
    echo "   Start it with: npm run supabase:start"
    exit 1
fi

# Extract values
API_URL=$(echo "$STATUS" | grep "Project URL" | awk '{print $3}')
PUBLISHABLE_KEY=$(echo "$STATUS" | grep "Publishable" | awk '{print $3}')

if [ -z "$API_URL" ] || [ -z "$PUBLISHABLE_KEY" ]; then
    echo "❌ Could not extract Supabase credentials"
    exit 1
fi

echo "Found credentials:"
echo "  API URL: $API_URL"
echo "  Publishable Key: $PUBLISHABLE_KEY"
echo ""

# Update or create .env.local
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY
EOF
else
    echo "Updating .env.local..."
    
    # Update or add NEXT_PUBLIC_SUPABASE_URL
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" .env.local 2>/dev/null || \
        sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" .env.local
    else
        echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL" >> .env.local
    fi
    
    # Update or add NEXT_PUBLIC_SUPABASE_ANON_KEY
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY|" .env.local 2>/dev/null || \
        sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY|" .env.local
    else
        echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY" >> .env.local
    fi
    
    rm -f .env.local.bak
fi

echo "✅ .env.local updated successfully!"
echo ""
echo "📋 Next step: Restart your Next.js dev server"
echo "   (Stop with Ctrl+C, then run: npm run dev)"
echo ""

