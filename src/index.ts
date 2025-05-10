#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { profileTools, getProfileByIdSchema, getProfileByEmailSchema, getProfileById, getProfileByEmail } from './operations/profile.js';
import { experimentalTools, getInferredInterestsByIdSchema, getInferredInterestsByEmailSchema, getInferredInterestsById, getInferredInterestsByEmail } from './operations/experimental.js';
import { avatarTools, getAvatarByIdSchema, getAvatarByEmailSchema, getAvatarById, getAvatarByEmail } from './operations/avatar.js';
import {
  GravatarError,
  GravatarValidationError,
  GravatarResourceNotFoundError,
  GravatarAuthenticationError,
  GravatarPermissionError,
  GravatarRateLimitError,
  isGravatarError,
  formatGravatarError,
} from './common/errors.js';
import { VERSION } from "./common/version.js";

// Create MCP server
const server = new Server(
  {
    name: "gravatar",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_profile_by_id",
        description: "Fetch a Gravatar profile using a profile identifier (hash).",
        inputSchema: zodToJsonSchema(getProfileByIdSchema),
      },
      {
        name: "get_profile_by_email",
        description: "Fetch a Gravatar profile using an email address.",
        inputSchema: zodToJsonSchema(getProfileByEmailSchema),
      },
      {
        name: "get_inferred_interests_by_id",
        description: "Fetch inferred interests for a Gravatar profile using a profile identifier (hash).",
        inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
      },
      {
        name: "get_inferred_interests_by_email",
        description: "Fetch inferred interests for a Gravatar profile using an email address.",
        inputSchema: zodToJsonSchema(getInferredInterestsByEmailSchema),
      },
      {
        name: "get_avatar_by_id",
        description: "Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).",
        inputSchema: zodToJsonSchema(getAvatarByIdSchema),
      },
      {
        name: "get_avatar_by_email",
        description: "Get the avatar PNG image for a Gravatar profile using an email address.",
        inputSchema: zodToJsonSchema(getAvatarByEmailSchema),
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "get_profile_by_id": {
        const args = getProfileByIdSchema.parse(request.params.arguments);
        const profile = await getProfileById(args.hash);
        return {
          content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
        };
      }

      case "get_profile_by_email": {
        const args = getProfileByEmailSchema.parse(request.params.arguments);
        const profile = await getProfileByEmail(args.email);
        return {
          content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
        };
      }

      case "get_inferred_interests_by_id": {
        const args = getInferredInterestsByIdSchema.parse(request.params.arguments);
        const interests = await getInferredInterestsById(args.hash);
        // Extract just the name field from each interest
        const interestNames = interests.map((interest: { name: string }) => interest.name);
        return {
          content: [{ type: "text", text: JSON.stringify(interestNames, null, 2) }],
        };
      }

      case "get_inferred_interests_by_email": {
        const args = getInferredInterestsByEmailSchema.parse(request.params.arguments);
        const interests = await getInferredInterestsByEmail(args.email);
        // Extract just the name field from each interest
        const interestNames = interests.map((interest: { name: string }) => interest.name);
        return {
          content: [{ type: "text", text: JSON.stringify(interestNames, null, 2) }],
        };
      }

      case "get_avatar_by_id": {
        const args = getAvatarByIdSchema.parse(request.params.arguments);
        const avatarBuffer = await getAvatarById(
          args.hash,
          args.size,
          args.defaultOption,
          args.forceDefault,
          args.rating
        );
        return {
          content: [{ 
            type: "image", 
            data: avatarBuffer.toString('base64'),
            mimeType: "image/png" 
          }],
        };
      }

      case "get_avatar_by_email": {
        const args = getAvatarByEmailSchema.parse(request.params.arguments);
        const avatarBuffer = await getAvatarByEmail(
          args.email,
          args.size,
          args.defaultOption,
          args.forceDefault,
          args.rating
        );
        return {
          content: [{ 
            type: "image", 
            data: avatarBuffer.toString('base64'),
            mimeType: "image/png" 
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isGravatarError(error)) {
      throw new Error(formatGravatarError(error));
    }
    throw error;
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gravatar MCP Server running on stdio");
  console.error(`Version: ${VERSION}`);
}

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});

// Export the server for testing
export default server;
