#!/bin/bash

echo "🔍 Checking Environment Setup"
echo "=============================="
echo ""

# Check .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file does not exist"
    echo ""
    echo "   Create it by running:"
    echo "   cp .env.local.example .env.local"
    echo ""
    echo "   Then fill in your Supabase credentials"
    exit 1
fi

echo "✅ .env.local file exists"
echo ""

# Check for required variables
echo "Checking environment variables..."
echo ""

if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2 | tr -d ' ' | tr -d '"')
    if [ -n "$SUPABASE_URL" ] && [ "$SUPABASE_URL" != "" ]; then
        echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is empty"
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL is missing"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    SUPABASE_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f2 | tr -d ' ' | tr -d '"')
    if [ -n "$SUPABASE_KEY" ] && [ "$SUPABASE_KEY" != "" ]; then
        echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set (length: ${#SUPABASE_KEY} chars)"
    else
        echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is empty"
    fi
else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
fi

echo ""
echo "📋 Next steps:"
echo "1. Make sure Supabase is running: npm run supabase:start"
echo "2. Restart Next.js dev server after updating .env.local"
echo ""

