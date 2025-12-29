# Installing Supabase CLI

Supabase CLI cannot be installed via `npm install -g`. Use one of these methods:

## Option 1: Direct Binary Download (Recommended - No Xcode needed)

For macOS (Apple Silicon):
```bash
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

For macOS (Intel):
```bash
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

Verify installation:
```bash
supabase --version
```

## Option 2: Homebrew (Requires Xcode Command Line Tools)

If you have Xcode Command Line Tools installed:
```bash
brew install supabase/tap/supabase
```

To install Xcode Command Line Tools first:
```bash
xcode-select --install
# Wait for installation to complete, then:
brew install supabase/tap/supabase
```

## Option 3: Using npx (For one-off commands only)

You can run Supabase CLI commands without installing:
```bash
npx supabase@latest init
npx supabase@latest start
```

However, the setup script requires Supabase CLI to be installed, so use Option 1 or 2 for full setup.

## Troubleshooting

- **"No developer tools installed"**: Use Option 1 (direct binary download) instead
- **"npm install -g supabase" fails**: This is expected - Supabase CLI doesn't support global npm installation
- **Permission denied**: Make sure you have sudo access for Option 1, or use Homebrew with Option 2

