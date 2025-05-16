import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  createExperimentalService,
  getInferredInterestsByIdSchema,
} from '../services/experimental-service.js';

// Tool definition
export const getInterestsByIdTool = {
  name: 'get_inferred_interests_by_id',
  description: 'Fetch inferred interests for a Gravatar profile using a profile identifier (hash).',
  inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getInferredInterestsByIdSchema>) {
  const experimentalService = await createExperimentalService();
  const interests = await experimentalService.getInferredInterestsById(params.hash);
  // Extract just the name field from each interest
  const interestNames = interests.map((interest: { name: string }) => interest.name);
  return {
    content: [{ type: 'text', text: JSON.stringify(interestNames, null, 2) }],
  };
}
