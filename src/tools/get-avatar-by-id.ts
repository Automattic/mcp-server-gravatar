import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateHash } from '../common/utils.js';
import { DefaultAvatarOption, Rating } from '../common/types.js';
import { createGravatarImageService } from '../services/gravatar-image-service.js';

// Schema definition
export const getAvatarByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message:
      'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.',
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
  rating: z.preprocess(val => (val === '' ? undefined : val), z.nativeEnum(Rating).optional()),
});

// Tool definition
export const getAvatarByIdTool = {
  name: 'get_avatar_by_id',
  description: 'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
  inputSchema: zodToJsonSchema(getAvatarByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getAvatarByIdSchema>) {
  const service = createGravatarImageService();
  const avatarBuffer = await service.getAvatarById(
    params.hash,
    params.size,
    params.defaultOption,
    params.forceDefault,
    params.rating,
  );
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
