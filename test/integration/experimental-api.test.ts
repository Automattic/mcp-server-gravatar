import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as utils from '../../src/common/utils.js';
import { getDefaultExperimentalService } from '../../src/services/experimental-service.js';
import { GravatarResourceNotFoundError } from '../../src/common/errors.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';
import { InterestFromJSON } from '../../src/generated/gravatar-api/models/Interest.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Experimental API Integration', () => {
  // Use a valid MD5 hash (32 characters) for testing
  const hash = '00000000000000000000000000000000';
  const email = 'test@example.com';
  let experimentalService;

  // Load the interests fixture and convert it to the proper type
  const interestsJson = JSON.parse(
    readFileSync(path.join(__dirname, '../fixtures/interests.json'), 'utf8'),
  );
  const interestsFixture = interestsJson.map(interest => InterestFromJSON(interest));

  beforeEach(async () => {
    // Setup runs before each test
    experimentalService = await getDefaultExperimentalService();
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('getInferredInterestsById', () => {
    it('should fetch and return inferred interests data', async () => {
      // Mock the ExperimentalApi.getProfileInferredInterestsById method
      vi.spyOn(ExperimentalApi.prototype, 'getProfileInferredInterestsById').mockResolvedValue(
        interestsFixture,
      );

      // Call the function
      const result = await experimentalService.getInferredInterestsById(hash);

      // Verify the mock was called
      expect(ExperimentalApi.prototype.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check the structure of the interests
      const firstInterest = result[0];
      expect(firstInterest).toHaveProperty('id');
      expect(firstInterest).toHaveProperty('name');
      expect(typeof firstInterest.id).toBe('number');
      expect(typeof firstInterest.name).toBe('string');
    });

    it('should handle 404 errors', async () => {
      // Mock the ExperimentalApi.getProfileInferredInterestsById method to throw a 404 error
      vi.spyOn(ExperimentalApi.prototype, 'getProfileInferredInterestsById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code',
      });

      // Call the function and expect it to throw
      await expect(experimentalService.getInferredInterestsById(hash)).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(experimentalService.getInferredInterestsById(hash)).rejects.toThrow(
        /Resource Not Found/,
      );

      // Verify the mock was called
      expect(ExperimentalApi.prototype.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
    });
  });

  describe('getInferredInterestsByEmail', () => {
    it('should fetch and return inferred interests data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Mock the ExperimentalApi.getProfileInferredInterestsById method
      vi.spyOn(ExperimentalApi.prototype, 'getProfileInferredInterestsById').mockResolvedValue(
        interestsFixture,
      );

      // Call the function
      const result = await experimentalService.getInferredInterestsByEmail(email);

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ExperimentalApi.prototype.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });

      // Verify the result
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check the structure of the interests
      const firstInterest = result[0];
      expect(firstInterest).toHaveProperty('id');
      expect(firstInterest).toHaveProperty('name');
      expect(typeof firstInterest.id).toBe('number');
      expect(typeof firstInterest.name).toBe('string');
    });

    it('should handle 404 errors', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Mock the ExperimentalApi.getProfileInferredInterestsById method to throw a 404 error
      vi.spyOn(ExperimentalApi.prototype, 'getProfileInferredInterestsById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code',
      });

      // Call the function and expect it to throw
      await expect(experimentalService.getInferredInterestsByEmail(email)).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(experimentalService.getInferredInterestsByEmail(email)).rejects.toThrow(
        /Resource Not Found/,
      );

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ExperimentalApi.prototype.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: hash,
      });
    });
  });
});
