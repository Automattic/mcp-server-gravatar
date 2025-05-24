import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { fetchInterestsById } from './experimental-utils.js';

// Schema definition
export const getInferredInterestsByIdSchema = z.object({
  profileIdentifier: z
    .string()
    .regex(
      /^([a-fA-F0-9]{32}|[a-fA-F0-9]{64})$/,
      'Invalid identifier format. Must be a 64-character (SHA256) or 32-character (MD5, deprecated) hexadecimal string.',
    ),
});

// Tool definition
export const getInterestsByIdTool = {
  name: 'get_inferred_interests_by_id',
  description: 'Fetch inferred interests for a Gravatar profile using a profile identifier.',
  inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getInferredInterestsByIdSchema>) {
  return await fetchInterestsById(params.profileIdentifier);
}
