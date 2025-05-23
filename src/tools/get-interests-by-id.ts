import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateHash } from '../common/utils.js';
import { createApiClient } from '../apis/api-client.js';
import { GravatarValidationError } from '../common/errors.js';

// Schema definition
export const getInferredInterestsByIdSchema = z.object({
  profileIdentifier: z.string().refine(validateHash, {
    message:
      'Invalid identifier format. Must be a 64-character (SHA256) or 32-character (MD5, deprecated) hexadecimal string.',
  }),
});

// Tool definition
export const getInterestsByIdTool = {
  name: 'get_inferred_interests_by_id',
  description: 'Fetch inferred interests for a Gravatar profile using a profile identifier.',
  inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getInferredInterestsByIdSchema>) {
  // Validate identifier
  if (!validateHash(params.profileIdentifier)) {
    throw new GravatarValidationError('Invalid identifier format');
  }

  // Use API client to get interests by ID
  const apiClient = await createApiClient();
  const interests = await apiClient.experimental.getProfileInferredInterestsById({
    profileIdentifier: params.profileIdentifier,
  });

  // Extract just the name field from each interest
  const interestNames = interests.map((interest: { name: string }) => interest.name);
  return {
    content: [{ type: 'text', text: JSON.stringify(interestNames, null, 2) }],
  };
}
