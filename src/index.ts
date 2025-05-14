#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { tools, handlers } from './tools/index.js';
import { isGravatarError, formatGravatarError } from './common/errors.js';
import { serverInfo, capabilities } from './config/server-config.js';

// Create MCP server
const server = new Server(serverInfo, { capabilities });

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    if (!request.params.arguments) {
      throw new Error('Arguments are required');
    }

    const toolName = request.params.name;
    const handler = handlers[toolName];

    if (!handler) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    // We need to cast the arguments to any to avoid TypeScript errors
    // The actual validation happens inside each handler with Zod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await handler(request.params.arguments as any);
  } catch (error) {
    // Format the error message based on error type
    let errorMessage = 'An unknown error occurred';

    if (error instanceof z.ZodError) {
      errorMessage = `Invalid input: ${JSON.stringify(error.errors)}`;
    } else if (isGravatarError(error)) {
      errorMessage = formatGravatarError(error);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Return error result
    return {
      isError: true,
      content: [{ type: 'text', text: errorMessage }],
    };
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gravatar MCP Server running on stdio');
  console.error(`Version: ${serverInfo.version}`);
}

runServer().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

// Export the server for testing
export default server;
