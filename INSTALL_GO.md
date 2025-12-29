# Installing Go for Local Development

The Go service is needed to search and fetch songs from Ultimate Guitar. You have two options:

## Option 1: Install Go Locally (Recommended for Testing)

### macOS (Homebrew)
```bash
brew install go
```

### macOS (Direct Download)
1. Visit https://go.dev/dl/
2. Download the macOS installer
3. Run the installer
4. Verify installation: `go version`

### Verify Installation
```bash
go version
# Should show something like: go version go1.21.0 darwin/arm64
```

### Run the Go Service
```bash
cd go-service
go mod download  # First time only
go run .
```

The service will start on http://localhost:8080

## Option 2: Deploy to Railway First (No Local Go Needed)

If you don't want to install Go locally, you can:

1. Deploy the Go service to Railway (see README.md)
2. Get the Railway deployment URL
3. Update `.env.local`:
   ```
   GO_SERVICE_URL=https://your-service.railway.app
   ```
4. Then test the Next.js app locally without running Go locally

## Troubleshooting

- **"command not found: go"**: Go is not installed or not in your PATH
- **"go: command not found"**: Make sure Go is installed and restart your terminal
- **Permission errors**: Make sure you have write access to the go-service directory

