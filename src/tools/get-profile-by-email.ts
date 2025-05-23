import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createApiClient } from '../apis/api-client.js';
import { validateEmail, generateIdentifierFromEmail } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';

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
  // Validate email
  if (!validateEmail(params.email)) {
    throw new GravatarValidationError('Invalid email format');
  }

  // Generate identifier from email
  const profileIdentifier = generateIdentifierFromEmail(params.email);

  // Use API client to get profile by ID
  const apiClient = await createApiClient();
  const profile = await apiClient.profiles.getProfileById({
    profileIdentifier: profileIdentifier,
  });

  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
