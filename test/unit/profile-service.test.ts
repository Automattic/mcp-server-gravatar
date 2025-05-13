import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createProfileService,
  profileTools,
  defaultProfileService,
} from '../../src/services/profile-service.js';
import type { IProfileClient, IProfileService } from '../../src/services/interfaces.js';
import { GravatarValidationError, GravatarResourceNotFoundError } from '../../src/common/errors.js';
import type { ApiErrorResponse } from '../../src/common/types.js';
import * as utils from '../../src/common/utils.js';

// Mock the utils functions
vi.mock('../../src/common/utils.js', () => {
  return {
    validateHash: vi.fn(),
    validateEmail: vi.fn(),
    generateIdentifierFromEmail: vi.fn(),
    createApiConfiguration: vi.fn(),
    mapHttpStatusToError: vi.fn(),
  };
});

describe('Profile MCP Tools', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Mock the defaultProfileService methods
    vi.spyOn(defaultProfileService, 'getProfileById').mockResolvedValue({
      hash: 'test-hash',
      displayName: 'Test User',
      profileUrl: 'https://gravatar.com/testuser',
    } as any);

    vi.spyOn(defaultProfileService, 'getProfileByEmail').mockResolvedValue({
      hash: 'test-hash',
      displayName: 'Test User',
      profileUrl: 'https://gravatar.com/testuser',
    } as any);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfileById tool', () => {
    it('should have the correct name and description', () => {
      const tool = profileTools[0];
      expect(tool.name).toBe('getProfileById');
      expect(tool.description).toBe('Fetch a Gravatar profile using a profile identifier (hash).');
    });

    it('should call the service with correct parameters', async () => {
      // Create a spy on the defaultProfileService.getProfileById method
      const getProfileByIdSpy = vi.spyOn(defaultProfileService, 'getProfileById');

      // Call the handler
      await profileTools[0].handler({ hash: 'test-hash' } as any);

      // Verify the service method was called with the correct parameters
      expect(getProfileByIdSpy).toHaveBeenCalledWith('test-hash');
    });

    it('should handle validation errors', async () => {
      // Create a new mock implementation for this test only
      const originalValidateHash = utils.validateHash;
      vi.mocked(utils.validateHash).mockImplementation(hash => {
        if (hash === 'invalid-hash') {
          return false;
        }
        return originalValidateHash(hash);
      });

      // Mock the defaultProfileService.getProfileById to throw an error for invalid hash
      vi.spyOn(defaultProfileService, 'getProfileById').mockImplementation(async hash => {
        if (!utils.validateHash(hash)) {
          throw new GravatarValidationError('Invalid hash format');
        }
        return {
          hash: 'test-hash',
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        } as any;
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'invalid-hash',
      } as any;

      await expect(profileTools[0].handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getProfileByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = profileTools[1];
      expect(tool.name).toBe('getProfileByEmail');
      expect(tool.description).toBe('Fetch a Gravatar profile using an email address.');
    });

    it('should call the service with correct parameters', async () => {
      // Create a spy on the defaultProfileService.getProfileByEmail method
      const getProfileByEmailSpy = vi.spyOn(defaultProfileService, 'getProfileByEmail');

      // Call the handler
      await profileTools[1].handler({ email: 'test@example.com' } as any);

      // Verify the service method was called with the correct parameters
      expect(getProfileByEmailSpy).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle validation errors', async () => {
      // Create a new mock implementation for this test only
      const originalValidateEmail = utils.validateEmail;
      vi.mocked(utils.validateEmail).mockImplementation(email => {
        if (email === 'invalid-email') {
          return false;
        }
        return originalValidateEmail(email);
      });

      // Mock the defaultProfileService.getProfileByEmail to throw an error for invalid email
      vi.spyOn(defaultProfileService, 'getProfileByEmail').mockImplementation(async email => {
        if (!utils.validateEmail(email)) {
          throw new GravatarValidationError('Invalid email format');
        }
        return {
          hash: 'test-hash',
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        } as any;
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'invalid-email',
      } as any;

      await expect(profileTools[1].handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});

describe('ProfileService', () => {
  let mockClient: IProfileClient;
  let service: IProfileService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock client
    mockClient = {
      getProfileById: vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
    };

    // Create the service with the mock client
    service = createProfileService(mockClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfileById', () => {
    it('should validate the hash', async () => {
      await service.getProfileById('test-hash');
      expect(utils.validateHash).toHaveBeenCalledWith('test-hash');
    });

    it('should throw GravatarValidationError for invalid hash', async () => {
      vi.mocked(utils.validateHash).mockReturnValue(false);
      await expect(service.getProfileById('invalid-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getProfileById('invalid-hash')).rejects.toThrow('Invalid hash format');
    });

    it('should call the client with correct parameters', async () => {
      await service.getProfileById('test-hash');
      expect(mockClient.getProfileById).toHaveBeenCalledWith({ profileIdentifier: 'test-hash' });
    });

    it('should return the profile data', async () => {
      const result = await service.getProfileById('test-hash');
      expect(result).toEqual({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error') as unknown as ApiErrorResponse;
      error.response = { status: 404 };

      mockClient.getProfileById = vi.fn().mockRejectedValue(error);
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Profile not found'));
      });

      await expect(service.getProfileById('test-hash')).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(service.getProfileById('test-hash')).rejects.toThrow('Profile not found');
    });
  });

  describe('getProfileByEmail', () => {
    it('should validate the email', async () => {
      await service.getProfileByEmail('test@example.com');
      expect(utils.validateEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw GravatarValidationError for invalid email', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);
      await expect(service.getProfileByEmail('invalid-email')).rejects.toThrow(
        GravatarValidationError,
      );
      await expect(service.getProfileByEmail('invalid-email')).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should generate identifier from email', async () => {
      await service.getProfileByEmail('test@example.com');
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should call getProfileById with generated hash', async () => {
      // Create a spy on the service's getProfileById method
      const getProfileByIdSpy = vi.spyOn(service, 'getProfileById');

      await service.getProfileByEmail('test@example.com');

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(getProfileByIdSpy).toHaveBeenCalledWith('email-hash');
    });

    it('should return the profile data', async () => {
      const result = await service.getProfileByEmail('test@example.com');
      expect(result).toEqual({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      });
    });
  });
});
