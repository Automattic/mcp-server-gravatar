import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as utils from '../../src/common/utils.js';
import { defaultProfileService } from '../../src/services/index.js';
import { GravatarResourceNotFoundError } from '../../src/common/errors.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Profile API Integration', () => {
  // Use a valid MD5 hash (32 characters) for testing
  const hash = '00000000000000000000000000000000';
  const email = 'test@example.com';
  
  // Load the profile fixture
  const profileFixture = JSON.parse(readFileSync(path.join(__dirname, '../fixtures/profile.json'), 'utf8'));
  
  // Ensure the hash in the fixture matches our test hash
  profileFixture.hash = hash;
  profileFixture.avatar_url = `https://1.gravatar.com/avatar/${hash}`;
  
  beforeEach(() => {
    // Setup runs before each test
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
      const result = await defaultProfileService.getProfileById(hash);
      
      // Verify the mock was called
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({ profileIdentifier: hash });
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.hash).toBe(hash);
      expect(result.display_name).toBe('Test User');
      expect(result.profile_url).toBe('https://gravatar.com/testuser');
      expect(result.verified_accounts).toBeInstanceOf(Array);
      expect(result.verified_accounts.length).toBeGreaterThan(0);
    });
    
    it('should handle 404 errors', async () => {
      // Mock the ProfilesApi.getProfileById method to throw a 404 error
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code'
      });
      
      // Call the function and expect it to throw
      await expect(defaultProfileService.getProfileById(hash)).rejects.toThrow(GravatarResourceNotFoundError);
      await expect(defaultProfileService.getProfileById(hash)).rejects.toThrow(/Resource Not Found/);
      
      // Verify the mock was called
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({ profileIdentifier: hash });
    });
  });
  
  describe('getProfileByEmail', () => {
    it('should fetch and return profile data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);
      
      // Mock the ProfilesApi.getProfileById method
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockResolvedValue(profileFixture);
      
      // Call the function
      const result = await defaultProfileService.getProfileByEmail(email);
      
      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({ profileIdentifier: hash });
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.hash).toBe(hash);
      expect(result.display_name).toBe('Test User');
      expect(result.profile_url).toBe('https://gravatar.com/testuser');
      expect(result.verified_accounts).toBeInstanceOf(Array);
      expect(result.verified_accounts.length).toBeGreaterThan(0);
    });
    
    it('should handle 404 errors', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);
      
      // Mock the ProfilesApi.getProfileById method to throw a 404 error
      vi.spyOn(ProfilesApi.prototype, 'getProfileById').mockRejectedValue({
        response: { status: 404 },
        message: 'Response returned an error code'
      });
      
      // Call the function and expect it to throw
      await expect(defaultProfileService.getProfileByEmail(email)).rejects.toThrow(GravatarResourceNotFoundError);
      await expect(defaultProfileService.getProfileByEmail(email)).rejects.toThrow(/Resource Not Found/);
      
      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(ProfilesApi.prototype.getProfileById).toHaveBeenCalledWith({ profileIdentifier: hash });
    });
  });
});
