import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateEmail, generateIdentifierFromEmail } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import { fetchInterestsById } from './experimental-utils.js';

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

  // Use shared interests fetching utility
  return await fetchInterestsById(profileIdentifier);
}
