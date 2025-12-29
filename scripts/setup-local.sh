#!/bin/bash

# Local Setup Script for Song Books
# This script helps you set up the local development environment

set -e

echo "🎵 Song Books - Local Setup"
echo "=========================="
echo ""

# Check if Supabase CLI is available (either globally or via npm)
if ! command -v supabase &> /dev/null && ! npm list supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo ""
    echo "   Install it locally with:"
    echo "   npm install supabase"
    echo ""
    echo "   Or install globally (see INSTALL_SUPABASE.md for options)"
    exit 1
fi

# Use npx if not globally installed, otherwise use direct command
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
    echo "✅ Supabase CLI found (global)"
else
    SUPABASE_CMD="npx supabase"
    echo "✅ Supabase CLI found (local npm package)"
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase..."
    $SUPABASE_CMD init
fi

# Start Supabase
echo "🚀 Starting Supabase..."
$SUPABASE_CMD start

echo ""
echo "✅ Supabase is running!"
echo ""

# Extract Supabase credentials from the output
echo "📋 Setting up environment variables..."

# Try to get the API URL and anon key from supabase status
SUPABASE_INFO=$($SUPABASE_CMD status 2>/dev/null || echo "")

if [ -n "$SUPABASE_INFO" ]; then
    # Extract API URL (look for http://localhost:54321)
    API_URL=$(echo "$SUPABASE_INFO" | grep -oP 'API URL:\s*\K[^\s]+' || echo "http://localhost:54321")
    # Extract anon key (look for the JWT token)
    ANON_KEY=$(echo "$SUPABASE_INFO" | grep -A 1 "anon key" | tail -1 | tr -d ' ' || echo "")
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.local.example" ]; then
            cp .env.local.example .env.local
        else
            cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
GO_SERVICE_URL=http://localhost:8080
EOF
        fi
        
        # Update with actual values if we found them
        if [ -n "$API_URL" ] && [ "$API_URL" != "http://localhost:54321" ]; then
            sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" .env.local 2>/dev/null || \
            sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" .env.local
        fi
        
        if [ -n "$ANON_KEY" ]; then
            sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local 2>/dev/null || \
            sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
        fi
        
        rm -f .env.local.bak
        
        echo "✅ Created .env.local file"
    else
        echo "ℹ️  .env.local already exists, skipping creation"
    fi
else
    echo "⚠️  Could not automatically extract Supabase credentials"
    echo "   Please check the output above and manually update .env.local"
fi

# Run database migration
echo ""
echo "📦 Running database migration..."
$SUPABASE_CMD db reset --yes || echo "⚠️  Migration may need to be run manually: npm run supabase:reset"

echo ""
echo "✅ Setup complete!"
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "⚠️  Go is not installed. You'll need it to run the Go service locally."
    echo ""
    echo "   Install Go:"
    echo "   - macOS: brew install go"
    echo "   - Or download from: https://go.dev/dl/"
    echo ""
    echo "   Alternatively, you can deploy the Go service to Railway first"
    echo "   and use that URL in GO_SERVICE_URL in .env.local"
    echo ""
else
    echo "✅ Go is installed"
fi

echo "📋 Next steps:"
echo "1. Verify .env.local has the correct Supabase credentials"
if command -v go &> /dev/null; then
    echo "2. Start Go service (in another terminal):"
    echo "   cd go-service && go run ."
    echo "3. Start Next.js app:"
else
    echo "2. Install Go (see above) or deploy Go service to Railway"
    echo "3. Start Next.js app:"
fi
echo "   npm install && npm run dev"
echo ""
echo "🌐 Supabase Studio: http://localhost:54323"
echo ""

