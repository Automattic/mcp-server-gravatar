import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  validateEmail,
  validateHash,
  generateIdentifierFromEmail,
  createApiConfiguration,
} from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import type { IProfileService, IProfilesApiClient } from './interfaces.js';
import type { Profile } from '../generated/gravatar-api/models/Profile.js';
import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { isApiErrorResponse } from '../common/types.js';
import { mapHttpStatusToError } from '../common/utils.js';

// Schema for getProfileById
export const getProfileByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message:
      'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.',
  }),
});

// Schema for getProfileByEmail
export const getProfileByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.',
  }),
});

/**
 * Service for interacting with Gravatar profiles
 * Uses the ProfilesApi client directly
 */
export class ProfileService implements IProfileService {
  constructor(private readonly profilesApiClient: IProfilesApiClient) {}

  /**
   * Get a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The profile data
   */
  async getProfileById(hash: string): Promise<Profile> {
    try {
      // Validate hash
      if (!validateHash(hash)) {
        throw new GravatarValidationError('Invalid hash format');
      }

      // Use API client directly
      const response = await this.profilesApiClient.getProfileById({ profileIdentifier: hash });
      return response;
    } catch (error: unknown) {
      // Handle API errors (moved from adapter)
      if (isApiErrorResponse(error)) {
        const mappedError = await mapHttpStatusToError(
          error.response?.status || 500,
          error.message || 'Failed to fetch profile',
        );
        throw mappedError;
      }

      throw error;
    }
  }

  /**
   * Get a profile by email address
   * @param email The email address
   * @returns The profile data
   */
  async getProfileByEmail(email: string): Promise<Profile> {
    // Validate email
    if (!validateEmail(email)) {
      throw new GravatarValidationError('Invalid email format');
    }

    // Generate identifier from email
    const identifier = generateIdentifierFromEmail(email);

    // Use getProfileById to fetch the profile
    return await this.getProfileById(identifier);
  }
}

/**
 * Factory function to create a ProfileService with the default API client
 * @returns A new ProfileService instance
 */
export async function createProfileService(): Promise<IProfileService> {
  const config = await createApiConfiguration();
  return new ProfileService(new ProfilesApi(config));
}

// Tool definitions for MCP
export const profileTools = [
  {
    name: 'getProfileById',
    description: 'Fetch a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getProfileByIdSchema),
    handler: async (params: z.infer<typeof getProfileByIdSchema>) => {
      const service = await createProfileService();
      return await service.getProfileById(params.hash);
    },
  },
  {
    name: 'getProfileByEmail',
    description: 'Fetch a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getProfileByEmailSchema),
    handler: async (params: z.infer<typeof getProfileByEmailSchema>) => {
      const service = await createProfileService();
      return await service.getProfileByEmail(params.email);
    },
  },
];
