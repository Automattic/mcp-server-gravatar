import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createApiClient } from '../apis/api-client.js';
import { validateHash } from '../common/utils.js';

// Schema definition (moved from service)
export const getProfileByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message:
      'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.',
  }),
});

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  description: 'Fetch a Gravatar profile using a profile identifier (hash).',
  inputSchema: zodToJsonSchema(getProfileByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getProfileByIdSchema>) {
  const apiClient = await createApiClient();
  const profile = await apiClient.profiles.getProfileById({
    profileIdentifier: params.hash,
  });
  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
