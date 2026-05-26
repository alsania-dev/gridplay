# GridPlay Makefile Documentation

This document provides detailed instructions for using the GridPlay Makefile commands.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- Make utility (pre-installed on most Unix-like systems)

## Quick Start

```bash
# View all available commands
make help

# First-time setup
make install

# Start development
make dev
```

## Available Commands

### `make help`

Displays all available Makefile commands with brief descriptions.

```bash
make help
```

**Output:**
```
GridPlay - Available Commands:
==============================
  make install    - Install dependencies
  make dev        - Start development server
  make build      - Build for production
  make start      - Start production server
  make lint       - Run ESLint
  make test       - Run tests
  make clean      - Clean build artifacts
```

---

### `make install`

Installs all project dependencies using npm.

```bash
make install
```

**When to use:**
- First time cloning the repository
- After pulling changes that update `package.json`
- When dependencies are missing or outdated

**What it does:**
- Runs `npm install`
- Creates/updates `node_modules/` directory
- Generates `package-lock.json` if needed

---

### `make dev`

Starts the Next.js development server with hot-reload.

```bash
make dev
```

**When to use:**
- During active development
- Testing changes in real-time

**What it does:**
- Runs `npm run dev`
- Starts server at `http://localhost:3000` (default)
- Enables hot module replacement (HMR)

**Environment:**
- Uses `.env.local` for environment variables
- Development mode with detailed error messages

---

### `make build`

Creates an optimized production build of the application.

```bash
make build
```

**When to use:**
- Before deploying to production
- Testing production build locally
- Verifying build succeeds

**What it does:**
- Runs `npm run build`
- Creates `.next/` directory with compiled assets
- Optimizes bundles for performance
- Performs type checking

**Output:**
- Static pages in `.next/server/pages/`
- Client bundles in `.next/static/`

---

### `make start`

Starts the production server using the built application.

```bash
make start
```

**Prerequisites:**
- Must run `make build` first
- Environment variables must be configured

**When to use:**
- Running production build locally
- Testing production behavior
- Deploying to a VPS or similar

**What it does:**
- Runs `npm run start`
- Serves optimized production build
- Starts server at `http://localhost:3000` (default)

---

### `make lint`

Runs ESLint to check code quality and style.

```bash
make lint
```

**When to use:**
- Before committing code
- During code review
- Fixing code style issues

**What it does:**
- Runs `npm run lint`
- Checks all `.ts`, `.tsx`, `.js`, `.jsx` files
- Reports warnings and errors

**Tips:**
- Fix auto-fixable issues: `npm run lint -- --fix`
- Check specific files: `npm run lint -- path/to/file.ts`

---

### `make test`

Runs the test suite.

```bash
make test
```

**When to use:**
- Before pushing changes
- After making modifications
- During CI/CD pipeline

**What it does:**
- Runs `npm test`
- Executes all test files matching patterns
- Reports test results and coverage

**Tips:**
- Run specific test: `npm test -- path/to/test.test.ts`
- Watch mode: `npm test -- --watch`
- Coverage report: `npm test -- --coverage`

---

### `make clean`

Removes build artifacts and cache files.

```bash
make clean
```

**When to use:**
- Encountering build errors
- Starting fresh after dependency changes
- Freeing disk space

**What it does:**
- Removes `.next/` directory
- Removes `out/` directory
- Removes `node_modules/.cache/`
- Removes `coverage/` directory

**Note:** Does not remove `node_modules/`. To fully clean:
```bash
make clean && rm -rf node_modules
```

---

## Common Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd gridplay

# 2. Copy environment file
cp .env.example .env.local

# 3. Edit environment variables
nano .env.local

# 4. Install dependencies
make install

# 5. Start development
make dev
```

### Before Committing

```bash
# 1. Run linter
make lint

# 2. Run tests
make test

# 3. Build to verify
make build
```

### Production Deployment

```bash
# 1. Install dependencies
make install

# 2. Build application
make build

# 3. Start production server
make start
```

### Troubleshooting Build Issues

```bash
# 1. Clean all artifacts
make clean

# 2. Reinstall dependencies
rm -rf node_modules package-lock.json
make install

# 3. Rebuild
make build
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables for full functionality:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_SECRET_KEY` - Stripe secret key

---

## Notes

- All commands assume you're in the project root directory
- The Makefile uses npm; modify for yarn or pnpm if preferred
- Production builds require proper environment configuration
- For Windows users, consider using WSL or Git Bash for Make support
