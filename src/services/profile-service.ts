import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateEmail, validateHash, generateIdentifierFromEmail } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import type { IProfileService } from './interfaces.js';
import type { Profile } from '../generated/gravatar-api/models/Profile.js';
import type { IProfileApiAdapter } from './adapters/index.js';
import { createRestApiAdapter } from './adapters/index.js';

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
 * Uses the adapter pattern to abstract API implementation details
 */
export class ProfileService implements IProfileService {
  constructor(private readonly adapter: IProfileApiAdapter) {}

  /**
   * Get a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The profile data
   */
  async getProfileById(hash: string): Promise<Profile> {
    try {
      console.error(`ProfileService.getProfileById called with hash: ${hash}`);

      // Validate hash
      if (!validateHash(hash)) {
        console.error(`Invalid hash format: ${hash}`);
        throw new GravatarValidationError('Invalid hash format');
      }

      // Use adapter to make API call
      console.error(`Using adapter to get profile for hash: ${hash}`);
      const response = await this.adapter.getProfileById(hash);
      console.error(`Received response for hash ${hash}:`, response);
      return response;
    } catch (error: unknown) {
      console.error(`Error getting profile for hash ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Get a profile by email address
   * @param email The email address
   * @returns The profile data
   */
  async getProfileByEmail(email: string): Promise<Profile> {
    try {
      console.error(`ProfileService.getProfileByEmail called with email: ${email}`);

      // Validate email
      if (!validateEmail(email)) {
        console.error(`Invalid email format: ${email}`);
        throw new GravatarValidationError('Invalid email format');
      }

      // Generate identifier from email
      const identifier = generateIdentifierFromEmail(email);
      console.error(`Generated identifier from email: ${identifier}`);

      // Use getProfileById to fetch the profile
      return await this.getProfileById(identifier);
    } catch (error) {
      console.error(`Error getting profile for email ${email}:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create a ProfileService with the default adapter
 * @returns A new ProfileService instance
 */
export async function createProfileService(): Promise<ProfileService> {
  const adapter = await createRestApiAdapter();
  return new ProfileService(adapter);
}

/**
 * Alias for createProfileService for consistency with other services
 * @returns A new ProfileService instance
 */
export async function getDefaultProfileService(): Promise<IProfileService> {
  return await createProfileService();
}

// Tool definitions for MCP
export const profileTools = [
  {
    name: 'getProfileById',
    description: 'Fetch a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getProfileByIdSchema),
    handler: async (params: z.infer<typeof getProfileByIdSchema>) => {
      const service = await getDefaultProfileService();
      return await service.getProfileById(params.hash);
    },
  },
  {
    name: 'getProfileByEmail',
    description: 'Fetch a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getProfileByEmailSchema),
    handler: async (params: z.infer<typeof getProfileByEmailSchema>) => {
      const service = await getDefaultProfileService();
      return await service.getProfileByEmail(params.email);
    },
  },
];
