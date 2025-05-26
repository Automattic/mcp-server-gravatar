import { generateIdentifierFromEmail } from '../common/utils.js';
import { fetchAvatar } from './avatar-utils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import type { DefaultAvatarOption } from '../common/types.js';
import type { Rating } from '../generated/gravatar-api/models/Rating.js';

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
export async function handler(params: {
  email: string;
  size?: number;
  defaultOption?: string;
  forceDefault?: boolean;
  rating?: string;
}) {
  if (!params.email) {
    throw new McpError(ErrorCode.InvalidParams, 'email is required');
  }

  const avatarIdentifier = generateIdentifierFromEmail(params.email);

  // Cast parameters to proper types for fetchAvatar
  const avatarParams = {
    avatarIdentifier,
    size: params.size,
    defaultOption: params.defaultOption as DefaultAvatarOption | undefined,
    forceDefault: params.forceDefault,
    rating: params.rating as Rating | undefined,
  };

  // Use shared avatar fetching utility
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
