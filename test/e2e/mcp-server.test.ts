import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as utils from '../../src/common/utils.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ApiErrorResponse } from '../../src/common/types.js';
import { createAvatarService } from '../../src/services/index.js';
import { getDefaultProfileService } from '../../src/services/profile-service.js';
import { getDefaultExperimentalService } from '../../src/services/experimental-service.js';
import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';
import fetch from 'node-fetch';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock the fetch function
vi.mock('node-fetch');

describe('MCP Server End-to-End', () => {
  // Use a valid MD5 hash (32 characters) for testing
  const hash = '00000000000000000000000000000000';
  const email = 'test@example.com';

  // Load the fixtures
  const profileFixture = JSON.parse(
    readFileSync(path.join(__dirname, '../fixtures/profile.json'), 'utf8'),
  );
  const interestsFixture = JSON.parse(
    readFileSync(path.join(__dirname, '../fixtures/interests.json'), 'utf8'),
  );

  // Ensure the hash in the profile fixture matches our test hash
  profileFixture.hash = hash;
  profileFixture.avatar_url = `https://1.gravatar.com/avatar/${hash}`;

  // Create a mock avatar buffer
  const mockAvatarBuffer = Buffer.from('This is a mock avatar image');

  // Create a mock Response object for fetch
  const createMockResponse = (status = 200, statusText = 'OK') => {
    const response = {
      ok: status >= 200 && status < 300,
      status,
      statusText,
      arrayBuffer: vi.fn().mockResolvedValue(mockAvatarBuffer),
    };
    return response;
  };

  // Create custom service instances with mocked dependencies
  let profileService;
  let experimentalService;
  let avatarService;

  beforeEach(async () => {
    // Reset all mocks
    vi.resetAllMocks();

    // Mock the ProfilesApi
    vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockResolvedValue(profileFixture);

    // Mock the ExperimentalApi
    vi.spyOn(ExperimentalApi.prototype, 'getProfileInferredInterestsById').mockResolvedValue(
      interestsFixture,
    );

    // Mock the fetch function for avatars
    vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

    // Create service instances with mocked dependencies
    profileService = await getDefaultProfileService();
    experimentalService = await getDefaultExperimentalService();
    avatarService = createAvatarService(fetch);
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('Profile Operations', () => {
    it('getProfileById should return profile data', async () => {
      const result = await profileService.getProfileById(hash);

      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
      expect(result).toBeDefined();
      expect(result.hash).toBe(hash);
      // The property names in the fixture might be different from what we expect
      // Check for either display_name or displayName
      expect(result.display_name || result.displayName).toBeDefined();
    });

    it('getProfileByEmail should return profile data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      const result = await profileService.getProfileByEmail(email);

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
      expect(result).toBeDefined();
      expect(result.hash).toBe(hash);
      // The property names in the fixture might be different from what we expect
      // Check for either display_name or displayName
      expect(result.display_name || result.displayName).toBeDefined();
    });
  });

  describe('Inferred Interests Operations', () => {
    it('getInferredInterestsById should return interests data', async () => {
      const result = await experimentalService.getInferredInterestsById(hash);

      expect(ExperimentalApi.prototype.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check the structure of the interests
      const firstInterest = result[0];
      expect(firstInterest).toHaveProperty('id');
      expect(firstInterest).toHaveProperty('name');
    });

    it('getInferredInterestsByEmail should return interests data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      const result = await experimentalService.getInferredInterestsByEmail(email);

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ExperimentalApi.prototype.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check the structure of the interests
      const firstInterest = result[0];
      expect(firstInterest).toHaveProperty('id');
      expect(firstInterest).toHaveProperty('name');
    });
  });

  describe('Avatar Operations', () => {
    it('getAvatarById should return avatar data', async () => {
      const result = await avatarService.getAvatarById(hash);

      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        }),
      );
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('getAvatarByEmail should return avatar data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      const result = await avatarService.getAvatarByEmail(email);

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        }),
      );
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid hash', async () => {
      // Mock validateHash to return false for invalid hash
      vi.spyOn(utils, 'validateHash').mockReturnValue(false);

      await expect(profileService.getProfileById('invalid-hash')).rejects.toThrow();
    });

    it('should handle invalid email', async () => {
      // Mock validateEmail to return false for invalid email
      vi.spyOn(utils, 'validateEmail').mockReturnValue(false);

      await expect(profileService.getProfileByEmail('invalid-email')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      // Mock the ProfilesApi to throw a 404 error
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code',
      } as ApiErrorResponse);

      await expect(profileService.getProfileById(hash)).rejects.toThrow();
    });
  });
});
