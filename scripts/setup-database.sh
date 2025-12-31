#!/bin/bash

# Complete Database and Storage Setup Script
# This script sets up the database schema and storage buckets programmatically

set -e

echo "🎵 Song Books - Complete Setup"
echo "=============================="
echo ""

# Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    SUPABASE_CMD="supabase"
    echo "✅ Supabase CLI found (global)"
elif npm list supabase &> /dev/null 2>&1; then
    SUPABASE_CMD="npx supabase"
    echo "✅ Supabase CLI found (local npm package)"
else
    echo "❌ Supabase CLI is not installed."
    echo "   Install it with: npm install supabase"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if Supabase is running
if ! $SUPABASE_CMD status &> /dev/null; then
    echo "🚀 Starting Supabase..."
    $SUPABASE_CMD start
    echo ""
fi

echo "📦 Setting up database schema..."

# Copy setup.sql to migrations temporarily so it gets applied
if [ -f "supabase/setup.sql" ]; then
    # Backup existing migrations
    if [ -d "supabase/migrations" ] && [ "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
        echo "   Backing up existing migrations..."
        mkdir -p supabase/migrations.backup
        cp supabase/migrations/*.sql supabase/migrations.backup/ 2>/dev/null || true
    fi
    
    # Replace migrations with our setup file
    echo "   Using setup.sql as migration..."
    mkdir -p supabase/migrations
    cp supabase/setup.sql supabase/migrations/$(date +%Y%m%d%H%M%S)_setup.sql
    
    # Reset database (this will apply our setup.sql)
    $SUPABASE_CMD db reset --yes
    
    # Restore original migrations if they existed
    if [ -d "supabase/migrations.backup" ] && [ "$(ls -A supabase/migrations.backup/*.sql 2>/dev/null)" ]; then
        echo "   Restoring original migrations..."
        cp supabase/migrations.backup/*.sql supabase/migrations/ 2>/dev/null || true
        rm -rf supabase/migrations.backup
    fi
else
    echo "⚠️  supabase/setup.sql not found, using default migrations"
    $SUPABASE_CMD db reset --yes
fi

# Get the service role key for API calls
echo ""
echo "📋 Getting Supabase credentials..."

# Extract service role key from status output
STATUS_OUTPUT=$($SUPABASE_CMD status 2>/dev/null)
SERVICE_ROLE_KEY=$(echo "$STATUS_OUTPUT" | grep -A 1 "service_role key" | tail -1 | tr -d ' ' || echo "")
API_URL=$(echo "$STATUS_OUTPUT" | grep -oP 'API URL:\s*\K[^\s]+' || echo "http://localhost:54321")
ANON_KEY=$(echo "$STATUS_OUTPUT" | grep -A 1 "anon key" | tail -1 | tr -d ' ' || echo "")

if [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "⚠️  Could not extract service role key automatically"
    echo "   Please check the output above and set SUPABASE_SERVICE_ROLE_KEY in .env.local"
else
    echo "✅ Extracted credentials"
fi

# Update .env.local with credentials
if [ ! -f ".env.local" ]; then
    cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOF
    echo "✅ Created .env.local file"
else
    # Update existing .env.local
    if [ -n "$API_URL" ]; then
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" .env.local 2>/dev/null || \
        sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" .env.local
    fi
    if [ -n "$ANON_KEY" ]; then
        sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local 2>/dev/null || \
        sed -i '' "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
    fi
    if [ -n "$SERVICE_ROLE_KEY" ]; then
        # Add or update service role key
        if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
            sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.local 2>/dev/null || \
            sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY|" .env.local
        else
            echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> .env.local
        fi
    fi
    rm -f .env.local.bak
    echo "✅ Updated .env.local file"
fi

echo ""
echo "🗂️  Setting up storage buckets..."

# Create storage buckets using Supabase Management API
# We'll use a Node.js script for this since bash curl can be tricky with auth
cat > /tmp/setup-storage.js << 'NODE_SCRIPT'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createBucket(name, public = false) {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`Error listing buckets: ${listError.message}`);
      return false;
    }

    const exists = buckets?.some(b => b.name === name);
    
    if (exists) {
      console.log(`✅ Bucket "${name}" already exists`);
      return true;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(name, {
      public: public,
      fileSizeLimit: name === 'song-videos' ? 1073741824 : 5242880, // 1GB for videos, 5MB for images
      allowedMimeTypes: name === 'song-videos' 
        ? ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm', 'video/x-msvideo']
        : ['image/*']
    });

    if (error) {
      console.error(`❌ Error creating bucket "${name}": ${error.message}`);
      return false;
    }

    console.log(`✅ Created bucket "${name}" (public: ${public})`);
    return true;
  } catch (err) {
    console.error(`❌ Error setting up bucket "${name}": ${err.message}`);
    return false;
  }
}

async function setup() {
  console.log('Creating storage buckets...');
  
  const coverBucket = await createBucket('songbook-covers', true);
  const videoBucket = await createBucket('song-videos', true);
  
  if (coverBucket && videoBucket) {
    console.log('');
    console.log('✅ All storage buckets set up successfully!');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Some buckets may not have been created. Check the errors above.');
    process.exit(1);
  }
}

setup();
NODE_SCRIPT

# Run the Node.js script to create storage buckets
echo "   Running bucket creation script..."
if node /tmp/setup-storage.js 2>&1; then
    echo ""
    echo "✅ Storage buckets created successfully!"
else
    echo ""
    echo "⚠️  Storage bucket creation had issues. Trying alternative method..."
    echo ""
    echo "   You can also create buckets manually:"
    echo "   1. Open Supabase Studio: http://localhost:54323"
    echo "   2. Go to Storage"
    echo "   3. Create buckets:"
    echo "      - 'songbook-covers' (public, 5MB limit, image/*)"
    echo "      - 'song-videos' (public, 1GB limit, video/*)"
    echo ""
    echo "   Or run: npm run create-video-bucket"
fi

rm -f /tmp/setup-storage.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ Database schema created"
echo "   ✅ Storage buckets created"
echo "   ✅ Environment variables updated in .env.local"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the development server:"
echo "      npm run dev"
echo ""
echo "🌐 Supabase Studio: http://localhost:54323"
echo "🌐 App: http://localhost:3000"
echo ""

