import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateEmail } from '../common/utils.js';
import { createExperimentalService } from '../services/experimental-service.js';

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
  const experimentalService = await createExperimentalService();
  const interests = await experimentalService.getInferredInterestsByEmail(params.email);
  // Extract just the name field from each interest
  const interestNames = interests.map((interest: { name: string }) => interest.name);
  return {
    content: [{ type: 'text', text: JSON.stringify(interestNames, null, 2) }],
  };
}
