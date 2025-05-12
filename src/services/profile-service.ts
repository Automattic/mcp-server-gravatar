import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import {
  validateEmail,
  validateHash,
  generateIdentifierFromEmail,
  createApiConfiguration,
  mapHttpStatusToError,
} from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import { isApiErrorResponse } from '../common/types.js';
import type { IProfileClient, IProfileService } from './interfaces.js';
import type { Profile } from '../generated/gravatar-api/models/Profile.js';

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

// Implement the ProfileService
export class ProfileService implements IProfileService {
  constructor(private readonly client: IProfileClient) {}

  async getProfileById(hash: string): Promise<Profile> {
    try {
      console.log(`ProfileService.getProfileById called with hash: ${hash}`);

      // Validate hash
      if (!validateHash(hash)) {
        console.error(`Invalid hash format: ${hash}`);
        throw new GravatarValidationError('Invalid hash format');
      }

      // Make API call
      console.log(`Making API call to get profile for hash: ${hash}`);
      const response = await this.client.getProfileById({ profileIdentifier: hash });
      console.log(`Received response for hash ${hash}:`, response);
      return response;
    } catch (error: unknown) {
      console.error(`Error getting profile for hash ${hash}:`, error);
      if (isApiErrorResponse(error)) {
        const mappedError = await mapHttpStatusToError(
          error.response?.status || 500,
          error.message || 'Failed to fetch profile',
        );
        console.error(`Mapped error:`, mappedError);
        throw mappedError;
      }
      throw error;
    }
  }

  async getProfileByEmail(email: string): Promise<Profile> {
    try {
      console.log(`ProfileService.getProfileByEmail called with email: ${email}`);

      // Validate email
      if (!validateEmail(email)) {
        console.error(`Invalid email format: ${email}`);
        throw new GravatarValidationError('Invalid email format');
      }

      // Generate identifier from email
      const identifier = generateIdentifierFromEmail(email);
      console.log(`Generated identifier from email: ${identifier}`);

      // Use getProfileById to fetch the profile
      return await this.getProfileById(identifier);
    } catch (error) {
      console.error(`Error getting profile for email ${email}:`, error);
      throw error;
    }
  }
}

// Factory function to create the default client
export function createProfileClient(): IProfileClient {
  return new ProfilesApi(createApiConfiguration());
}

// Factory function to create the service with optional client
export function createProfileService(client?: IProfileClient): IProfileService {
  return new ProfileService(client || createProfileClient());
}

// Default instance for convenience
export const defaultProfileService = createProfileService();

// Tool definitions for MCP
export const profileTools = [
  {
    name: 'getProfileById',
    description: 'Fetch a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getProfileByIdSchema),
    handler: async (params: z.infer<typeof getProfileByIdSchema>) => {
      return await defaultProfileService.getProfileById(params.hash);
    },
  },
  {
    name: 'getProfileByEmail',
    description: 'Fetch a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getProfileByEmailSchema),
    handler: async (params: z.infer<typeof getProfileByEmailSchema>) => {
      return await defaultProfileService.getProfileByEmail(params.email);
    },
  },
];
