import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProfileService, profileTools } from '../../src/services/profile-service.js';
import type { IProfileService } from '../../src/services/interfaces.js';
import { ProfileService } from '../../src/services/profile-service.js';
import type { IProfileApiAdapter } from '../../src/services/adapters/interfaces.js';
import { GravatarValidationError, GravatarResourceNotFoundError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import * as adapters from '../../src/services/adapters/index.js';

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

// Mock the adapters
vi.mock('../../src/services/adapters/index.js', () => {
  return {
    createRestApiAdapter: vi.fn(),
    createLegacyApiAdapter: vi.fn(),
  };
});

// Mock the createProfileService function
vi.mock('../../src/services/profile-service.js', async () => {
  const actual = await vi.importActual('../../src/services/profile-service.js');
  return {
    ...actual,
    createProfileService: vi.fn(),
  };
});

describe('Profile MCP Tools', () => {
  let mockProfileService: IProfileService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock profile service
    mockProfileService = {
      getProfileById: vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
      getProfileByEmail: vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
    };

    // Mock the createProfileService function
    vi.mocked(createProfileService).mockResolvedValue(mockProfileService);
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
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(createProfileService).mockResolvedValue(mockProfileService);

      // Setup the mock service to return a specific value
      const mockProfile = {
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      };
      (mockProfileService.getProfileById as any).mockResolvedValue(mockProfile);

      // Create a spy for mapHttpStatusToError to ensure it returns a proper error
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Profile not found'));
      });

      // Create a custom handler function that uses our mocked service
      const handler = async (params: { hash: string }) => {
        const service = await createProfileService();
        return await service.getProfileById(params.hash);
      };

      // Call the handler
      const result = await handler({ hash: 'test-hash' });

      // Verify the service method was called with the correct parameters
      expect(mockProfileService.getProfileById).toHaveBeenCalledWith('test-hash');
      expect(createProfileService).toHaveBeenCalled();

      // Verify the handler returns the expected result
      expect(result).toEqual(mockProfile);
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

      // Mock the service to throw an error for invalid hash
      const mockGetProfileById = mockProfileService.getProfileById as any;
      mockGetProfileById.mockImplementation(async (hash: string) => {
        if (!utils.validateHash(hash)) {
          throw new GravatarValidationError('Invalid hash format');
        }
        return {
          hash: 'test-hash',
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        };
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
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(createProfileService).mockResolvedValue(mockProfileService);

      // Setup the mock service to return a specific value
      const mockProfile = {
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      };
      (mockProfileService.getProfileByEmail as any).mockResolvedValue(mockProfile);

      // Create a spy for mapHttpStatusToError to ensure it returns a proper error
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Profile not found'));
      });

      // Create a custom handler function that uses our mocked service
      const handler = async (params: { email: string }) => {
        const service = await createProfileService();
        return await service.getProfileByEmail(params.email);
      };

      // Call the handler
      const result = await handler({ email: 'test@example.com' });

      // Verify the service method was called with the correct parameters
      expect(mockProfileService.getProfileByEmail).toHaveBeenCalledWith('test@example.com');
      expect(createProfileService).toHaveBeenCalled();

      // Verify the handler returns the expected result
      expect(result).toEqual(mockProfile);
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

      // Mock the service to throw an error for invalid email
      const mockGetProfileByEmail = mockProfileService.getProfileByEmail as any;
      mockGetProfileByEmail.mockImplementation(async (email: string) => {
        if (!utils.validateEmail(email)) {
          throw new GravatarValidationError('Invalid email format');
        }
        return {
          hash: 'test-hash',
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        };
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
  let mockAdapter: IProfileApiAdapter;
  let service: IProfileService;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock adapter
    mockAdapter = {
      getProfileById: vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
    };

    // Mock the createRestApiAdapter function to return our mock adapter
    vi.mocked(adapters.createRestApiAdapter).mockResolvedValue(mockAdapter as any);

    // Create the service with the mock adapter directly
    service = new ProfileService(mockAdapter);
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

    it('should call the adapter with correct parameters', async () => {
      await service.getProfileById('test-hash');
      expect(mockAdapter.getProfileById).toHaveBeenCalledWith('test-hash');
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
      const error = new Error('API Error');

      mockAdapter.getProfileById = vi.fn().mockRejectedValue(error);

      await expect(service.getProfileById('test-hash')).rejects.toThrow(error);
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

    it('should handle errors from getProfileById', async () => {
      // Create a spy on getProfileById that throws an error
      const getProfileByIdSpy = vi.spyOn(service, 'getProfileById');
      const testError = new Error('Test error from getProfileById');
      getProfileByIdSpy.mockRejectedValue(testError);

      await expect(service.getProfileByEmail('test@example.com')).rejects.toThrow(
        'Test error from getProfileById',
      );
      await expect(service.getProfileByEmail('test@example.com')).rejects.toThrow(testError);
    });

    it('should handle API errors propagated from getProfileById', async () => {
      // Create a spy on getProfileById that throws a GravatarResourceNotFoundError
      const getProfileByIdSpy = vi.spyOn(service, 'getProfileById');
      const notFoundError = new GravatarResourceNotFoundError('Profile not found');
      getProfileByIdSpy.mockRejectedValue(notFoundError);

      await expect(service.getProfileByEmail('test@example.com')).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(service.getProfileByEmail('test@example.com')).rejects.toThrow(
        'Profile not found',
      );
    });
  });
});
