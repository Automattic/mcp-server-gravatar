# Makefile for MCP Server Gravatar - Common Tasks

# Constants
OPENAPI_GENERATOR_VERSION = 7.13.0

.PHONY: download-spec generate-client test lint clean dev build inspect help

# Default target shows help
help:
	@echo "Available targets:"
	@echo "  download-spec     - Download Gravatar OpenAPI spec"
	@echo "  generate-client   - Generate Gravatar API client from OpenAPI spec"

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
