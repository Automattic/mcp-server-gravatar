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
