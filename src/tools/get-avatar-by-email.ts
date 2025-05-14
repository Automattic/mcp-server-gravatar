import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { defaultAvatarService, getAvatarByEmailSchema } from '../services/avatar-service.js';

// Tool definition
export const getAvatarByEmailTool = {
  name: 'get_avatar_by_email',
  description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
  inputSchema: zodToJsonSchema(getAvatarByEmailSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getAvatarByEmailSchema>) {
  const avatarBuffer = await defaultAvatarService.getAvatarByEmail(
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
