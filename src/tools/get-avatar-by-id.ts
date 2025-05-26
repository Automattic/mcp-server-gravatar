import { fetchAvatar } from './avatar-utils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { DefaultAvatarOption } from '../common/types.js';
import type { Rating } from '../generated/gravatar-api/models/Rating.js';

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
export async function handler(params: {
  avatarIdentifier: string;
  size?: number;
  defaultOption?: string;
  forceDefault?: boolean;
  rating?: string;
}) {
  if (!params.avatarIdentifier) {
    throw new McpError(ErrorCode.InvalidParams, 'avatarIdentifier is required');
  }

  // Cast parameters to proper types for fetchAvatar
  const avatarParams = {
    avatarIdentifier: params.avatarIdentifier,
    size: params.size,
    defaultOption: params.defaultOption as DefaultAvatarOption | undefined,
    forceDefault: params.forceDefault,
    rating: params.rating as Rating | undefined,
  };

  // Let Gravatar API handle format validation
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
}
