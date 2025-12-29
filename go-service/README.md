# Go Scraper Service

HTTP service wrapper for Ultimate Guitar scraping functionality.

## Endpoints

- `GET /search?q={query}` - Search for songs
- `GET /tab/{id}` - Fetch tab by Ultimate Guitar ID
- `GET /health` - Health check

## Running Locally

```bash
go mod download
go run .
```

The service will start on port 8080 (or PORT environment variable).

## Deployment to Railway

1. Connect your repository to Railway
2. Railway will automatically detect the Dockerfile and deploy
3. The service will be available at the Railway-provided URL

