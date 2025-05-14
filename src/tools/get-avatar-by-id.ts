import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { getDefaultAvatarService, getAvatarByIdSchema } from '../services/avatar-service.js';

// Tool definition
export const getAvatarByIdTool = {
  name: 'get_avatar_by_id',
  description: 'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
  inputSchema: zodToJsonSchema(getAvatarByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getAvatarByIdSchema>) {
  const service = getDefaultAvatarService();
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
