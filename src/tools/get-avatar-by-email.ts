import { generateIdentifier, handleEmailToolError } from '../common/utils.js';
import { fetchAvatar } from './avatar-utils.js';

// Tool definition
export const getAvatarByEmailTool = {
  name: 'get_avatar_by_email',
  description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Email address',
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
    required: ['email'],
  },
};

// Tool handler
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetAvatarByEmail(params: any) {
  const { email, size, defaultOption, forceDefault, rating } = params;

  try {
    const avatarIdentifier = generateIdentifier(email);

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
    return handleEmailToolError(error, email, 'fetch avatar');
  }
}
