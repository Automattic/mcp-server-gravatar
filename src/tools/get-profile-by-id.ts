import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createProfileService, getProfileByIdSchema } from '../services/profile-service.js';

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  description: 'Fetch a Gravatar profile using a profile identifier (hash).',
  inputSchema: zodToJsonSchema(getProfileByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getProfileByIdSchema>) {
  const profileService = await createProfileService();
  const profile = await profileService.getProfileById(params.hash);
  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
