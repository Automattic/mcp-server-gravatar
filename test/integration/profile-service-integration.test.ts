import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as utils from '../../src/common/utils.js';
import { createProfileService } from '../../src/services/profile-service.js';
import { GravatarResourceNotFoundError } from '../../src/common/errors.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ProfileFromJSON } from '../../src/generated/gravatar-api/models/Profile.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ProfileService Integration', () => {
  // Use a valid MD5 hash (32 characters) for testing
  const hash = '00000000000000000000000000000000';
  const email = 'test@example.com';
  let profileService;

  // Load the profile fixture and convert it to the proper type
  const profileJson = JSON.parse(
    readFileSync(path.join(__dirname, '../fixtures/profile.json'), 'utf8'),
  );

  // Ensure the hash in the fixture matches our test hash
  profileJson.hash = hash;
  profileJson.avatar_url = `https://1.gravatar.com/avatar/${hash}`;

  // Convert the JSON to a Profile object using the generated conversion function
  const profileFixture = ProfileFromJSON(profileJson);

  beforeEach(async () => {
    // Setup runs before each test
    profileService = await createProfileService();
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('getProfileById', () => {
    it('should fetch and return profile data', async () => {
      // Mock the ProfilesApi.getProfileById method
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockResolvedValue(profileFixture);

      // Call the function
      const result = await profileService.getProfileById(hash);

      // Verify the mock was called
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.hash).toBe(hash);
      expect(result.displayName).toBe('Test User');
      expect(result.profileUrl).toBe('https://gravatar.com/testuser');
      expect(result.verifiedAccounts).toBeInstanceOf(Array);
      expect(result.verifiedAccounts.length).toBeGreaterThan(0);
    });

    it('should handle 404 errors', async () => {
      // Mock the ProfilesApi.getProfileById method to throw a 404 error
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code',
      });

      // Call the function and expect it to throw
      await expect(profileService.getProfileById(hash)).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(profileService.getProfileById(hash)).rejects.toThrow(/Resource Not Found/);

      // Verify the mock was called
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
    });
  });

  describe('getProfileByEmail', () => {
    it('should fetch and return profile data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Mock the ProfilesApi.getProfileById method
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockResolvedValue(profileFixture);

      // Call the function
      const result = await profileService.getProfileByEmail(email);

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(result.hash).toBe(hash);
      expect(result.displayName).toBe('Test User');
      expect(result.profileUrl).toBe('https://gravatar.com/testuser');
      expect(result.verifiedAccounts).toBeInstanceOf(Array);
      expect(result.verifiedAccounts.length).toBeGreaterThan(0);
    });

    it('should handle 404 errors', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Mock the ProfilesApi.getProfileById method to throw a 404 error
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code',
      });

      // Call the function and expect it to throw
      await expect(profileService.getProfileByEmail(email)).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(profileService.getProfileByEmail(email)).rejects.toThrow(/Resource Not Found/);

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
    });
  });
});
