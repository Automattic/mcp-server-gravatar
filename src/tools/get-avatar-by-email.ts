import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  getDefaultAvatarService,
  getAvatarByEmailSchema,
} from '../services/gravatar-image-service.js';

// Tool definition
export const getAvatarByEmailTool = {
  name: 'get_avatar_by_email',
  description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
  inputSchema: zodToJsonSchema(getAvatarByEmailSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getAvatarByEmailSchema>) {
  const service = getDefaultAvatarService();
  const avatarBuffer = await service.getAvatarByEmail(
    params.email,
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
