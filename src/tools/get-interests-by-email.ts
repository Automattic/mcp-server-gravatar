import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { createRestApiConfig } from '../config/server-config.js';
import { validateEmail, generateIdentifierFromEmail } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';

// Schema definition
export const getInferredInterestsByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.',
  }),
});

// Tool definition
export const getInterestsByEmailTool = {
  name: 'get_inferred_interests_by_email',
  description: 'Fetch inferred interests for a Gravatar profile using an email address.',
  inputSchema: zodToJsonSchema(getInferredInterestsByEmailSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getInferredInterestsByEmailSchema>) {
  // Validate email
  if (!validateEmail(params.email)) {
    throw new GravatarValidationError('Invalid email format');
  }

  // Generate identifier from email
  const profileIdentifier = generateIdentifierFromEmail(params.email);

  // Use direct API client to get interests by ID
  const config = createRestApiConfig();
  const experimentalApi = new ExperimentalApi(config);
  const interests = await experimentalApi.getProfileInferredInterestsById({
    profileIdentifier: profileIdentifier,
  });

  // Extract just the name field from each interest
  const interestNames = interests.map((interest: { name: string }) => interest.name);
  return {
    content: [{ type: 'text', text: JSON.stringify(interestNames, null, 2) }],
  };
}
