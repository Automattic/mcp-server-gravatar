# Makefile for MCP Server Gravatar - Common Tasks

# Constants
OPENAPI_GENERATOR_VERSION = 7.13.0

.PHONY: download-spec generate-client test test-coverage lint lint-fix format format-check quality-check clean dev build inspector help

# Default target shows help
help:
	@echo "Available targets:"
	@echo "  download-spec     - Download Gravatar OpenAPI spec"
	@echo "  generate-client   - Generate Gravatar API client from OpenAPI spec"
	@echo "  build             - Build the TypeScript project"
	@echo "  test              - Run tests"
	@echo "  test-coverage     - Run tests with coverage"
	@echo "  lint              - Run linting"
	@echo "  lint-fix          - Run linting with auto-fix"
	@echo "  format            - Format code with Prettier"
	@echo "  format-check      - Check code formatting"
	@echo "  quality-check     - Run linting and format checking"
	@echo "  dev               - Start TypeScript compiler in watch mode"
	@echo "  inspector         - Build and run MCP inspector to validate tools"
	@echo "  clean             - Clean build artifacts"

# Download OpenAPI spec
download-spec:
	@echo "Downloading Gravatar OpenAPI spec..."
	@curl -s https://api.gravatar.com/v3/openapi -o openapi.json
	@echo "OpenAPI spec downloaded to openapi.json"

# Generate OpenAPI client
generate-client:
	@echo "Generating Gravatar API client from local OpenAPI spec..."
	@npx @openapitools/openapi-generator-cli generate
	@echo "API client generated."

# Build the project
build:
	@echo "Building the project..."
	npm run build
	@echo "Build completed."

# Run tests
test:
	@echo "Running tests..."
	npm test
	@echo "Tests completed."

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	npm run test:coverage
	@echo "Test coverage completed."

# Linting and formatting
lint:
	@echo "Running linter..."
	npm run lint
	@echo "Linting completed."

lint-fix:
	@echo "Running linter with auto-fix..."
	npm run lint:fix
	@echo "Linting and fixing completed."

format:
	@echo "Formatting code..."
	npm run format
	@echo "Formatting completed."

format-check:
	@echo "Checking code formatting..."
	npm run format:check
	@echo "Format check completed."

# Combined quality check
quality-check: lint format-check
	@echo "Quality check completed."

# Start development mode (watch for changes)
dev:
	@echo "Starting TypeScript compiler in watch mode..."
	npm run dev

# Build and run MCP inspector
inspector:
	@echo "Building and running MCP inspector..."
	npm run build && npm run inspector
	@echo "Inspection completed."

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf build/
	@echo "Clean completed."
