# Song Books

A web application for creating, managing, and sharing songbooks with lyrics and guitar chords from Ultimate Guitar.

## Quick Start (Local Development)

For local testing, see [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed instructions.

**Easiest way to get started:**

```bash
# Run the setup script (requires Supabase CLI and Docker)
./scripts/setup-local.sh

# Then follow the instructions it prints
```

**Manual setup:**
1. Install Supabase CLI locally: `npm install supabase` (already done!)
2. Start local Supabase: `npm run supabase:start` (copy the API URL and keys)
3. Create `.env.local` with the local Supabase credentials
4. Run migration: `npm run supabase:reset`
5. Start Go service: `cd go-service && go run .`
6. Start Next.js: `npm run dev`

## Production Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials and Go service URL.

3. Run the development server:
```bash
npm run dev
```

## Project Structure

- `app/` - Next.js app router pages
- `components/` - React components
- `lib/` - Utility functions and types
- `go-service/` - Go HTTP service for Ultimate Guitar scraping
- `supabase/migrations/` - Database migrations

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migration in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor
3. Copy your Supabase URL and anon key from the project settings

## Deployment

### Go Service (Railway)

1. Create a Railway account at https://railway.app
2. Create a new project and connect your repository
3. Select the `go-service` directory as the root
4. Railway will automatically detect the Dockerfile and deploy
5. Copy the deployment URL (e.g., `https://your-service.railway.app`)

### Next.js App (Vercel or Railway)

1. Deploy to Vercel:
   - Connect your GitHub repository to Vercel
   - Set environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `GO_SERVICE_URL` (your Railway Go service URL)
   - Deploy

2. Or deploy to Railway:
   - Create a new service in your Railway project
   - Select the root directory (not go-service)
   - Set the same environment variables
   - Deploy

