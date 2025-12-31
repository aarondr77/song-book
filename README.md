# Song Books

A web application for creating and managing songbooks with chord charts and videos.

## Development Setup

### Prerequisites
- Node.js 18+
- Docker Desktop
- Supabase CLI (`npm install supabase`)

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up local Supabase**
   ```bash
   npm run setup
   ```
   This will:
   - Start local Supabase (via Docker)
   - Create database schema from `supabase/setup.sql`
   - Create storage buckets (`songbook-covers` and `song-videos`)
   - Configure `.env.local` with credentials

3. **Start development server**
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:3000` and Supabase Studio at `http://localhost:54323`.

## Production Deployment

### Deploy Supabase

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project reference ID

2. **Login to Supabase CLI**
   ```bash
   npx supabase login
   ```
   This will open your browser to authenticate with Supabase.

3. **Link local project to remote**
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
   You'll be prompted to enter your database password.

4. **Deploy database schema**
   ```bash
   npx supabase db push
   ```
   Or manually run `supabase/setup.sql` in the Supabase SQL Editor.

5. **Set up storage buckets**
   - Get your production credentials from Supabase Dashboard → Settings → API
   - Update `.env.local` with production values:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
     SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
     ```
   - Run the storage setup script:
     ```bash
     node scripts/setup-storage.js
     ```

### Deploy Application

TODO: Add hosting instructions (Vercel, etc.)

## Project Structure

- `supabase/setup.sql` - Complete database schema
- `scripts/setup-storage.js` - Creates storage buckets programmatically
- `app/` - Next.js application routes
- `components/` - React components

