import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Configuration } from '../generated/gravatar-api/runtime.js';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { validateEmail, validateHash, generateIdentifierFromEmail, createApiConfiguration, mapHttpStatusToError } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';

// Schema for getInferredInterestsById
export const getInferredInterestsByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message: 'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.'
  })
});

// Schema for getInferredInterestsByEmail
export const getInferredInterestsByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.'
  })
});

// Create API client
function createExperimentalApi(): ExperimentalApi {
  // Create a new ExperimentalApi instance with the configuration
  return new ExperimentalApi(createApiConfiguration());
}

/**
 * Get inferred interests for a profile by hash
 * @param hash The profile hash
 * @returns The inferred interests data
 */
export async function getInferredInterestsById(hash: string): Promise<any> {
  try {
    // Validate hash
    if (!validateHash(hash)) {
      throw new GravatarValidationError('Invalid hash format');
    }
    
    // Create API client
    const experimentalApi = createExperimentalApi();

    // Make API call
    const response = await experimentalApi.getProfileInferredInterestsById({ profileIdentifier: hash });
    return response;
  } catch (error: any) {
    if (error.response && error.response.status) {
      throw await mapHttpStatusToError(error.response.status, error.message || 'Failed to fetch inferred interests');
    }
    throw error;
  }
}

/**
 * Get inferred interests for a profile by email
 * @param email The email address
 * @returns The inferred interests data
 */
export async function getInferredInterestsByEmail(email: string): Promise<any> {
  try {
    // Validate email
    if (!validateEmail(email)) {
      throw new GravatarValidationError('Invalid email format');
    }
    
    // Generate identifier from email
    const identifier = generateIdentifierFromEmail(email);
    
    // Use getInferredInterestsById to fetch the inferred interests
    return await getInferredInterestsById(identifier);
  } catch (error) {
    throw error;
  }
}

// Tool definitions for MCP
export const experimentalTools = [
  {
    name: 'getInferredInterestsById',
    description: 'Fetch inferred interests for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
    handler: async (params: z.infer<typeof getInferredInterestsByIdSchema>) => {
      return await getInferredInterestsById(params.hash);
    }
  },
  {
    name: 'getInferredInterestsByEmail',
    description: 'Fetch inferred interests for a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getInferredInterestsByEmailSchema),
    handler: async (params: z.infer<typeof getInferredInterestsByEmailSchema>) => {
      return await getInferredInterestsByEmail(params.email);
    }
  }
];
