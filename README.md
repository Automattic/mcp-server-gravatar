# MCP Server Gravatar

Gravatar's official MCP Server, enabling Claude to interact with Gravatar avatars, profiles, and inferred interests.

## Identifier Types

The Gravatar MCP server uses different types of identifiers to access profile and avatar data:

### Profile Identifiers

A **Profile Identifier** can be one of the following:

1. **SHA256 Hash** (preferred): An email address that has been normalized (lower-cased and trimmed) and then hashed with SHA256
2. **MD5 Hash** (deprecated): An email address that has been normalized (lower-cased and trimmed) and then hashed with MD5
3. **URL Slug**: The username portion from a Gravatar profile URL (e.g., 'username' from gravatar.com/username)

### Avatar Identifiers

An **Avatar Identifier** is an email address that has been normalized (lower-cased and trimmed) and then hashed with either:

1. **SHA256** (preferred)
2. **MD5** (deprecated)

**Important**: Unlike Profile Identifiers, Avatar Identifiers cannot use URL slugs - only email hashes are supported.

### Email Addresses

When using email-based tools, you can provide any valid email format. The system will automatically:

1. Normalize the email (convert to lowercase and trim whitespace)
2. Generate the appropriate hash for API requests
3. Process the email securely without storing it

## Tools

1. `get_profile_by_id`
   - Retrieve comprehensive Gravatar profile information using a profile identifier. Returns detailed user profile data including display name, location, job title, company, bio/description, pronouns, pronunciation, verified social accounts, avatar details, and profile URLs. Additional authenticated data may include languages, interests, links, contact info, and gallery images.
   - Required inputs:
     - `profileIdentifier` (string): A Profile Identifier (see [Identifier Types](#identifier-types) section)
   - Returns: Profile object as JSON with comprehensive user information

2. `get_profile_by_email`
   - Retrieve comprehensive Gravatar profile information using an email address. Returns detailed user profile data including display name, location, job title, company, bio/description, pronouns, pronunciation, verified social accounts, avatar details, and profile URLs. Additional authenticated data may include languages, interests, links, contact info, and gallery images.
   - Required inputs:
     - `email` (string): The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup.
   - Returns: Profile object as JSON with comprehensive user information

3. `get_inferred_interests_by_id`
   - Fetch AI-inferred interests for a Gravatar profile using a profile identifier. Returns machine learning-generated interest data that can help understand user preferences, content recommendations, or audience insights. This is experimental data that may not be available for all profiles.
   - Required inputs:
     - `profileIdentifier` (string): A Profile Identifier (see [Identifier Types](#identifier-types) section)
   - Returns: List of AI-inferred interest names as JSON

4. `get_inferred_interests_by_email`
   - Fetch AI-inferred interests for a Gravatar profile using an email address. Returns a list of topics and interests that Gravatar's machine learning algorithms have associated with the profile based on public activity and connections. This experimental feature helps understand user preferences and topics of interest.
   - Required inputs:
     - `email` (string): The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup.
   - Returns: List of AI-inferred interest names as JSON

5. `get_avatar_by_id`
   - Retrieve the avatar image for a Gravatar profile using an avatar identifier. Functionally identical to the email variant but uses a direct identifier for lookup. More efficient when you already have the hashed identifier.
   - Required inputs:
     - `avatarIdentifier` (string): An Avatar Identifier (see [Identifier Types](#identifier-types) section)
   - Optional inputs:
     - `size` (number, default: undefined): Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays).
     - `defaultOption` (string, default: undefined): Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent).
     - `forceDefault` (boolean, default: undefined): When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.
     - `rating` (string, default: undefined): Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.
   - Returns: Avatar image in PNG format

6. `get_avatar_by_email`
   - Retrieve the avatar image for a Gravatar profile using an email address. Returns a PNG image that can be displayed directly or processed further. Supports extensive customization options including size, fallback behavior, content rating filters, and default image styles.
   - Required inputs:
     - `email` (string): The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup.
   - Optional inputs:
     - `size` (number, default: undefined): Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays).
     - `defaultOption` (string, default: undefined): Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent).
     - `forceDefault` (boolean, default: undefined): When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.
     - `rating` (string, default: undefined): Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.
   - Returns: Avatar image in PNG format

### Default Avatar Options

- `404`: Return an HTTP 404 error instead of an image when no avatar exists
- `mp`: (mystery-person) A simple, cartoon-style silhouetted outline of a person
- `identicon`: A geometric pattern based on an email hash
- `monsterid`: A generated 'monster' with different colors, faces, etc
- `wavatar`: Generated faces with differing features and backgrounds
- `retro`: Awesome generated, 8-bit arcade-style pixelated faces
- `robohash`: A generated robot with different colors, faces, etc
- `blank`: A transparent PNG image

### Rating Options

- `G`: Suitable for display on all websites with any audience type
- `PG`: May contain rude gestures, provocatively dressed individuals, the lesser swear words, or mild violence
- `R`: May contain harsh profanity, intense violence, nudity, or hard drug use
- `X`: May contain sexual imagery or extremely disturbing violence

## Setup

### Gravatar API Key

While the Gravatar API can be used without authentication, using an API key is recommended as it increases the rate limits for your queries. You can generate your own API key by visiting the [Developer Dashboard](https://gravatar.com/developers/).

Once you have your API key, you can configure it in Claude Desktop or VS Code as shown in the sections below.

### Claude Desktop Configuration

Add the following to your `claude_desktop_config.json`:

#### With API Key (Recommended)

```json
{
  "mcpServers": {
    "gravatar": {
      "command": "npx",
      "args": [
        "-y",
        "github:Automattic/mcp-server-gravatar"
      ],
      "env": {
        "GRAVATAR_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Without API Key

```json
{
  "mcpServers": {
    "gravatar": {
      "command": "npx",
      "args": [
        "-y",
        "github:Automattic/mcp-server-gravatar"
      ]
    }
  }
}
```

### VS Code Configuration

For quick installation, click one of the installation buttons below:

[![Install with NPX in VS Code](https://img.shields.io/badge/VS_Code-NPX-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=gravatar&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gravatar_api_key%22%2C%22description%22%3A%22Gravatar%20API%20Key%20(optional)%22%2C%22password%22%3Atrue%7D%5D&command=%22npx%22&args=%5B%22-y%22%2C%22github%3AAutomattic%2Fmcp-server-gravatar%22%5D&env=%7B%22GRAVATAR_API_KEY%22%3A%22%24%7Binput%3Agravatar_api_key%7D%22%7D) [![Install with NPX in VS Code Insiders](https://img.shields.io/badge/VS_Code_Insiders-NPX-2ABF63?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=gravatar&inputs=%5B%7B%22type%22%3A%22promptString%22%2C%22id%22%3A%22gravatar_api_key%22%2C%22description%22%3A%22Gravatar%20API%20Key%20(optional)%22%2C%22password%22%3Atrue%7D%5D&command=%22npx%22&args=%5B%22-y%22%2C%22github%3AAutomattic%2Fmcp-server-gravatar%22%5D&env=%7B%22GRAVATAR_API_KEY%22%3A%22%24%7Binput%3Agravatar_api_key%7D%22%7D)

For manual installation, add one of the following JSON blocks to your User Settings (JSON) file in VS Code. You can do this by pressing `Cmd + Shift + P` (or `Ctrl + Shift + P` on Windows/Linux) and typing `Preferences: Open Settings (JSON)`.

#### With API Key Input (Recommended)

This configuration prompts for an API key and stores it securely:

```json
{
  "mcp": {
    "inputs": [
      {
        "type": "promptString",
        "id": "gravatar_api_key",
        "description": "Gravatar API Key (optional)",
        "password": true
      }
    ],
    "servers": {
      "gravatar": {
        "command": "npx",
        "args": ["-y", "github:Automattic/mcp-server-gravatar"],
        "env": {
          "GRAVATAR_API_KEY": "${input:gravatar_api_key}"
        }
      }
    }
  }
}
```

#### Without API Key

If you don't want to use an API key:

```json
{
  "mcp": {
    "servers": {
      "gravatar": {
        "command": "npx",
        "args": ["-y", "github:Automattic/mcp-server-gravatar"]
      }
    }
  }
}
```

Optionally, you can add either configuration to a file called `.vscode/mcp.json` in your workspace. This will allow you to share the configuration with others.

> Note that the `mcp` key is not needed in the `.vscode/mcp.json` file.

### Building from Local Source Files

If you want to build and run the MCP server from local source files:

```bash
# Clone the repository
git clone https://github.com/Automattic/mcp-server-gravatar.git
cd mcp-server-gravatar

# Install dependencies
npm install

# Generate Gravatar API client from OpenAPI spec
npm run generate-client

# Build the project
npm run build

# Run the server (without API key)
npm start

# Or run with an API key (recommended)
GRAVATAR_API_KEY=your-api-key-here npm start
```

## Development

### Using the Inspector

The MCP Inspector is a tool that helps validate your MCP server implementation. To run the inspector:

```bash
make inspector
```

This will build the project and then run the MCP Inspector against your server, validating the tools and their schemas.

### Development Workflow

Start the TypeScript compiler in watch mode:

```bash
make dev
```

This will watch for changes to your TypeScript files and automatically recompile them.

To run the server after compilation:

```bash
npm start
```

### Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Other Useful Commands

The project includes a Makefile with several useful commands:

- `make download-spec`: Download the Gravatar OpenAPI spec
- `make generate-client`: Generate the Gravatar API client from the OpenAPI spec
- `make build`: Build the TypeScript project
- `make lint`: Run linting
- `make lint-fix`: Run linting with auto-fix
- `make format`: Format code with Prettier
- `make format-check`: Check code formatting
- `make quality-check`: Run linting and format checking
- `make clean`: Clean build artifacts

Run `make help` to see all available commands.

## Environment Variables

- `GRAVATAR_API_KEY`: Optional API key for Gravatar API. If provided, it will be used for API requests, which increases rate limits and provides access to additional features.

- `GRAVATAR_API_KEY_ENV_VAR`: Optional name of the environment variable that contains the API key. Default is `GRAVATAR_API_KEY`. This is useful if you need to use a different environment variable name in your deployment environment.

When running the server locally, you can set these environment variables in your shell before starting the server:

```bash
# Set API key (recommended)
export GRAVATAR_API_KEY=your_api_key_here

# Start the server
npm start
```

Or you can provide them inline when starting the server:

```bash
GRAVATAR_API_KEY=your_api_key_here npm start
```

When configuring the server in Claude Desktop or VS Code, you can set these environment variables in the configuration as shown in the Setup section above.

## Troubleshooting

If you encounter errors, verify that:

1. You have the latest version of the MCP server
2. Your API key is correctly configured (if using one)
3. You have internet connectivity to access the Gravatar API
4. The email or hash you're using is valid

## License

This MCP server is licensed under the Mozilla Public License Version 2.0 (MPL-2.0). This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MPL-2.0. For more details, please see the [LICENSE](LICENSE) file in the project repository.
