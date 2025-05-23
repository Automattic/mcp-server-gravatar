import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateEmail, generateIdentifierFromEmail } from '../common/utils.js';
import { DefaultAvatarOption } from '../common/types.js';
import { Rating } from '../generated/gravatar-api/models/Rating.js';
import { GravatarValidationError } from '../common/errors.js';
import { fetchAvatar } from './avatar-utils.js';

// Schema definition
export const getAvatarByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format',
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
export const getAvatarByEmailTool = {
  name: 'get_avatar_by_email',
  description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
  inputSchema: zodToJsonSchema(getAvatarByEmailSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getAvatarByEmailSchema>) {
  if (!validateEmail(params.email)) {
    throw new GravatarValidationError('Invalid email format');
  }

  const avatarIdentifier = generateIdentifierFromEmail(params.email);

  // Use shared avatar fetching utility
  const avatarBuffer = await fetchAvatar({
    avatarIdentifier,
    size: params.size,
    defaultOption: params.defaultOption,
    forceDefault: params.forceDefault,
    rating: params.rating,
  });

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
