import { assertNonEmpty, handleIdToolError } from '../common/utils.js';
import { fetchAvatar } from './avatar-utils.js';

// Tool definition
export const getAvatarByIdTool = {
  name: 'get_avatar_by_id',
  title: 'Get Avatar Image by ID',
  description:
    "Retrieve the avatar image for a Gravatar profile using an avatar identifier. More efficient when you already have the hashed identifier. <examples>'Get the avatar image for this Gravatar ID' or 'Show me a 150px avatar for user ID abc123...'</examples>",
  inputSchema: {
    type: 'object',
    properties: {
      avatarIdentifier: {
        type: 'string',
        description:
          'Avatar identifier for the Gravatar profile. An Avatar Identifier is an email address that has been normalized (e.g. lower-cased and trimmed) and then hashed with either SHA256 (preferred) or MD5 (deprecated). Note: Unlike profile identifiers, avatar identifiers cannot use URL slugs - only email hashes are supported.',
      },
      size: {
        type: 'number',
        description:
          'Desired avatar size in pixels (1-2048). Images are square, so this sets both width and height. Common sizes: 80 (default web), 200 (high-res web), 512 (large displays). Gravatar will scale the image appropriately.',
        minimum: 1,
        maximum: 2048,
      },
      defaultOption: {
        type: 'string',
        description:
          "Fallback image style when no avatar exists. Options: '404' (return HTTP 404 error instead of image), 'mp' (mystery person silhouette), 'identicon' (geometric pattern), 'monsterid' (generated monster), 'wavatar' (generated face), 'retro' (8-bit style), 'robohash' (robot), 'blank' (transparent). If not specified, Gravatar's default image is returned when no avatar exists.",
        enum: ['404', 'mp', 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'blank'],
      },
      forceDefault: {
        type: 'boolean',
        description:
          "When true, always returns the default image instead of the user's avatar. Useful for testing default options or ensuring consistent placeholder images.",
      },
      rating: {
        type: 'string',
        description:
          "Maximum content rating to display. 'G' (general audiences), 'PG' (parental guidance), 'R' (restricted), 'X' (explicit). If user's avatar exceeds this rating, the default image is shown instead.",
        enum: ['G', 'PG', 'R', 'X'],
      },
    },
    required: ['avatarIdentifier'],
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
    idempotentHint: true,
  },
};

// Tool handler
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetAvatarById(params: any) {
  const { avatarIdentifier, size, defaultOption, forceDefault, rating } = params;

  try {
    assertNonEmpty(avatarIdentifier);

    const avatarParams = {
      avatarIdentifier,
      size,
      defaultOption,
      forceDefault,
      rating,
    };

    const avatarResult = await fetchAvatar(avatarParams);

    return {
      content: [
        {
          type: 'image',
          data: avatarResult.buffer.toString('base64'),
          mimeType: avatarResult.mimeType,
        },
      ],
    };
  } catch (error) {
    return handleIdToolError(error, avatarIdentifier, 'fetch avatar');
  }
}
