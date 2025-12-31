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
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createBucket(name, config) {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error(`❌ Error listing buckets: ${listError.message}`);
      return false;
    }

    const exists = buckets?.some(b => b.name === name);
    
    if (exists) {
      console.log(`✅ Bucket "${name}" already exists`);
      return true;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(name, config);

    if (error) {
      console.error(`❌ Error creating bucket "${name}": ${error.message}`);
      return false;
    }

    console.log(`✅ Created bucket "${name}" (public: ${config.public})`);
    return true;
  } catch (err) {
    console.error(`❌ Error setting up bucket "${name}": ${err.message}`);
    return false;
  }
}

async function setup() {
  console.log('🗂️  Setting up storage buckets...');
  console.log('');
  
  // Create songbook-covers bucket
  const coverBucket = await createBucket('songbook-covers', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/*']
  });
  
  // Create song-videos bucket
  const videoBucket = await createBucket('song-videos', {
    public: true,
    fileSizeLimit: 52428800, // 50MB (Supabase free tier limit; increase if you have a paid plan)
    allowedMimeTypes: ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm', 'video/x-msvideo']
  });
  
  console.log('');
  if (coverBucket && videoBucket) {
    console.log('✅ All storage buckets set up successfully!');
    process.exit(0);
  } else {
    console.log('⚠️  Some buckets may not have been created. Check the errors above.');
    process.exit(1);
  }
}

setup();

