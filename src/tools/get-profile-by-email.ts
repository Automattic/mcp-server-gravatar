import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createProfileService } from '../services/profile-service.js';
import { validateEmail } from '../common/utils.js';

// Schema definition (moved from service)
export const getProfileByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.',
  }),
});

// Tool definition
export const getProfileByEmailTool = {
  name: 'get_profile_by_email',
  description: 'Fetch a Gravatar profile using an email address.',
  inputSchema: zodToJsonSchema(getProfileByEmailSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getProfileByEmailSchema>) {
  const profileService = await createProfileService();
  const profile = await profileService.getProfileByEmail(params.email);
  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
