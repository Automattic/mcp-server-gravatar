import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DefaultConfig, Configuration } from '../generated/gravatar-api/runtime.js';
import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { validateEmail, validateHash, generateIdentifierFromEmail, createApiConfiguration, mapHttpStatusToError } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';

// Schema for getProfileById
export const getProfileByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message: 'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.'
  })
});

// Schema for getProfileByEmail
export const getProfileByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.'
  })
});

// Create API client
function createProfilesApi(): ProfilesApi {
  // Create a new ProfilesApi instance with the configuration
  return new ProfilesApi(createApiConfiguration());
}

/**
 * Get a profile by hash
 * @param hash The profile hash (MD5 or SHA256)
 * @returns The profile data
 */
export async function getProfileById(hash: string): Promise<any> {
  try {
    // Validate hash
    if (!validateHash(hash)) {
      throw new GravatarValidationError('Invalid hash format');
    }

    // Create API client
    const profilesApi = createProfilesApi();

    // Make API call
    const response = await profilesApi.getProfileById({ profileIdentifier: hash });
    return response;
  } catch (error: any) {
    if (error.response && error.response.status) {
      throw await mapHttpStatusToError(error.response.status, error.message || 'Failed to fetch profile');
    }
    throw error;
  }
}

/**
 * Get a profile by email
 * @param email The email address
 * @returns The profile data
 */
export async function getProfileByEmail(email: string): Promise<any> {
  try {
    // Validate email
    if (!validateEmail(email)) {
      throw new GravatarValidationError('Invalid email format');
    }

    // Generate identifier from email
    const identifier = generateIdentifierFromEmail(email);

    // Use getProfileById to fetch the profile
    return await getProfileById(identifier);
  } catch (error) {
    throw error;
  }
}

// Tool definitions for MCP
export const profileTools = [
  {
    name: 'getProfileById',
    description: 'Fetch a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getProfileByIdSchema),
    handler: async (params: z.infer<typeof getProfileByIdSchema>) => {
      return await getProfileById(params.hash);
    }
  },
  {
    name: 'getProfileByEmail',
    description: 'Fetch a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getProfileByEmailSchema),
    handler: async (params: z.infer<typeof getProfileByEmailSchema>) => {
      return await getProfileByEmail(params.email);
    }
  }
];
