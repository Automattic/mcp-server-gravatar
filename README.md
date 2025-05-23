# MCP Server Gravatar

Gravatar's official MCP Server, enabling Claude to interact with Gravatar avatars, profiles, and inferred interests.

## Tools

1. `get_profile_by_id`
   - Fetch a Gravatar profile using a profile identifier.
   - Required inputs:
     - `profileIdentifier` (string): The profile identifier (SHA256 or MD5 hash)
   - Returns: Profile object as JSON with user information

2. `get_profile_by_email`
   - Fetch a Gravatar profile using an email address.
   - Required inputs:
     - `email` (string): The email address associated with the Gravatar profile
   - Returns: Profile object as JSON with user information

3. `get_inferred_interests_by_id`
   - Fetch inferred interests for a Gravatar profile using a profile identifier.
   - Required inputs:
     - `profileIdentifier` (string): The profile identifier (SHA256 or MD5 hash)
   - Returns: List of inferred interest names as JSON

4. `get_inferred_interests_by_email`
   - Fetch inferred interests for a Gravatar profile using an email address.
   - Required inputs:
     - `email` (string): The email address associated with the Gravatar profile
   - Returns: List of inferred interest names as JSON

5. `get_avatar_by_id`
   - Get the avatar PNG image for a Gravatar profile using an avatar identifier.
   - Required inputs:
     - `avatarIdentifier` (string): The avatar identifier (SHA256 or MD5 hash)
   - Optional inputs:
     - `size` (number, default: undefined): Preferred size of the avatar (1-2048 pixels)
     - `defaultOption` (string, default: undefined): Default avatar option if no avatar exists
     - `forceDefault` (boolean, default: undefined): Force the default avatar to be shown
     - `rating` (string, default: undefined): Maximum rating of avatar to display
   - Returns: Avatar image in PNG format

6. `get_avatar_by_email`
   - Get the avatar PNG image for a Gravatar profile using an email address.
   - Required inputs:
     - `email` (string): The email address associated with the Gravatar profile
   - Optional inputs:
     - `size` (number, default: undefined): Preferred size of the avatar (1-2048 pixels)
     - `defaultOption` (string, default: undefined): Default avatar option if no avatar exists
     - `forceDefault` (boolean, default: undefined): Force the default avatar to be shown
     - `rating` (string, default: undefined): Maximum rating of avatar to display
   - Returns: Avatar image in PNG format

### Default Avatar Options

- `initials`: Uses the profile name as initials, with a generated background and foreground color
- `color`: A generated color
- `404`: Do not load any image if none is associated with the email hash, instead return an HTTP 404 response
- `mp`: (mystery-person) A simple, cartoon-style silhouetted outline of a person
- `identicon`: A geometric pattern based on an email hash
- `monsterid`: A generated 'monster' with different colors, faces, etc
- `wavatar`: Generated faces with differing features and backgrounds
- `retro`: Awesome generated, 8-bit arcade-style pixelated faces
- `robohash`: A generated robot with different colors, faces, etc
- `blank`: A transparent PNG image

### Rating Options

- `g`: Suitable for display on all websites with any audience type
- `pg`: May contain rude gestures, provocatively dressed individuals, the lesser swear words, or mild violence
- `r`: May contain harsh profanity, intense violence, nudity, or hard drug use
- `x`: May contain sexual imagery or extremely disturbing violence

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
