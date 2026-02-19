# ===========================================
# GridPlay Makefile
# ===========================================
# Common commands for development and deployment
# Run `make help` to see all available commands
# ===========================================

.PHONY: help install dev build start lint test clean

# Default target
help:
	@echo "GridPlay - Available Commands:"
	@echo "=============================="
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo "  make lint       - Run ESLint"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean build artifacts"
	@echo ""

# Install dependencies
install:
	@echo "Installing dependencies..."
	npm install

# Start development server
dev:
	@echo "Starting development server..."
	npm run dev

# Build for production
build:
	@echo "Building for production..."
	npm run build

# Start production server
start:
	@echo "Starting production server..."
	npm run start

# Run ESLint
lint:
	@echo "Running ESLint..."
	npm run lint

# Run tests
test:
	@echo "Running tests..."
	npm test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf .next
	rm -rf out
	rm -rf node_modules/.cache
	rm -rf coverage
	@echo "Clean complete."
