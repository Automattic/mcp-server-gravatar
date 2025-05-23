import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateHash } from '../common/utils.js';
import { DefaultAvatarOption } from '../common/types.js';
import { Rating } from '../generated/gravatar-api/models/Rating.js';
import { fetchAvatar } from './avatar-utils.js';

// Schema definition
export const getAvatarByIdSchema = z.object({
  avatarIdentifier: z.string().refine(validateHash, {
    message:
      'Invalid identifier format. Must be a 64-character (SHA256) or 32-character (MD5, deprecated) hexadecimal string.',
  }),
  size: z.preprocess(val => (val === '' ? undefined : val), z.number().min(1).max(2048).optional()),
  defaultOption: z.preprocess(
    val => (val === '' ? undefined : val),
    z.nativeEnum(DefaultAvatarOption).optional(),
  ),
  forceDefault: z.preprocess(val => {
    if (val === '') return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  rating: z.preprocess(val => {
    if (val === '' || val === undefined) return undefined;
    if (typeof val === 'string') {
      return val.toUpperCase(); // Normalize to uppercase for validation
    }
    return val;
  }, z.nativeEnum(Rating).optional()),
});

// Tool definition
export const getAvatarByIdTool = {
  name: 'get_avatar_by_id',
  description: 'Get the avatar PNG image for a Gravatar profile using an avatar identifier.',
  inputSchema: zodToJsonSchema(getAvatarByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getAvatarByIdSchema>) {
  const avatarBuffer = await fetchAvatar(params);
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
