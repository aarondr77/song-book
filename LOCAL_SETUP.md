# Local Development Setup

This guide will help you test the application locally before deploying to production.

## Prerequisites

- Node.js 18+ installed
- Docker Desktop installed (for local Supabase)

## Option 1: Local Supabase (Recommended)

### 1. Install Supabase CLI

**Option A: Install as local npm package (Easiest)**
```bash
npm install supabase
```

Then use it via `npx supabase` or `npm run supabase:*` scripts.

**Option B: Direct Binary Download**

**Option A: Direct Binary Download (Recommended - No Xcode needed)**
```bash
# Download and install the binary directly
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

**Option B: Using Homebrew (Requires Xcode Command Line Tools)**
```bash
# First install Xcode Command Line Tools if needed:
xcode-select --install

# Then install Supabase CLI
brew install supabase/tap/supabase
```

**Option C: Using npx (No installation needed)**
You can use Supabase CLI via npx without installing:
```bash
npx supabase@latest <command>
```
However, for the setup script, you'll need it installed. Use Option A or B.

**Note:** If you get an error about missing developer tools, use Option A (direct binary download) instead.

### 2. Initialize Supabase

If you installed locally via npm:
```bash
npx supabase init
# Or use the npm script:
npm run supabase:init
```

If you installed globally:
```bash
supabase init
```

### 3. Start Local Supabase

If you installed locally via npm:
```bash
npx supabase start
# Or use the npm script:
npm run supabase:start
```

If you installed globally:
```bash
supabase start
```

This will start a local Supabase instance with:
- PostgreSQL database
- Supabase Studio (web UI) at http://localhost:54323
- API URL and keys displayed in the terminal

### 4. Copy Environment Variables

After running `supabase start`, you'll see output like:

```
API URL: http://localhost:54321
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Then fill it in with:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase-start>
```

### 5. Run Database Migration

In Supabase Studio (http://localhost:54323), go to SQL Editor and run the contents of `supabase/migrations/001_initial_schema.sql`

Or use the CLI:
```bash
# If installed locally:
npm run supabase:reset
# Or: npx supabase db reset

# If installed globally:
supabase db reset
```

This will apply all migrations.

## Option 2: Run Next.js App

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Testing the Full Stack

1. Make sure Supabase is running (`supabase start`)
2. Make sure Next.js app is running (`npm run dev`)
3. Open http://localhost:3000 in your browser
4. Try creating a songbook and adding songs by pasting Ultimate Guitar URLs!

## Troubleshooting

### Supabase Connection Issues
- Make sure Docker is running
- Check that Supabase is started: `supabase status`
- Verify your `.env.local` has the correct URL and keys

### Database Migration Errors
- Make sure you're using the local Supabase instance
- Try resetting the database: `supabase db reset`
- Check Supabase Studio logs for errors

## Stopping Local Services

```bash
# Stop Supabase
supabase stop

# Stop Next.js
# Just press Ctrl+C in the terminal where it's running
```

