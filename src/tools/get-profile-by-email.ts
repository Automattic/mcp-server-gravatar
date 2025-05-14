import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { defaultProfileService, getProfileByEmailSchema } from '../services/profile-service.js';

// Tool definition
export const getProfileByEmailTool = {
  name: 'get_profile_by_email',
  description: 'Fetch a Gravatar profile using an email address.',
  inputSchema: zodToJsonSchema(getProfileByEmailSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getProfileByEmailSchema>) {
  const profile = await defaultProfileService.getProfileByEmail(params.email);
  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
