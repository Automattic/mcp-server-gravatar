import { fetchAvatar } from './avatar-utils.js';

// Tool definition
export const getAvatarByIdTool = {
  name: 'get_avatar_by_id',
  description: 'Get the avatar PNG image for a Gravatar profile using an avatar identifier.',
  inputSchema: {
    type: 'object',
    properties: {
      avatarIdentifier: {
        type: 'string',
        description: 'Avatar identifier (32 or 64 character hash)',
      },
      size: {
        type: 'number',
        description: 'Size of the avatar image (1-2048)',
        minimum: 1,
        maximum: 2048,
      },
      defaultOption: {
        type: 'string',
        description: 'Default avatar option',
        enum: ['404', 'mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank'],
      },
      forceDefault: {
        type: 'boolean',
        description: 'Force default avatar',
      },
      rating: {
        type: 'string',
        description: 'Content rating',
        enum: ['G', 'PG', 'R', 'X'],
      },
    },
    required: ['avatarIdentifier'],
  },
};

// Tool handler
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetAvatarById(params: any) {
  const { avatarIdentifier, size, defaultOption, forceDefault, rating } = params;

  try {
    const avatarParams = {
      avatarIdentifier,
      size,
      defaultOption,
      forceDefault,
      rating,
    };

    const avatarBuffer = await fetchAvatar(avatarParams);
    return {
      content: [
        {
          type: 'image',
          data: avatarBuffer.toString('base64'),
          mimeType: 'image/png',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch avatar for identifier "${avatarIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
