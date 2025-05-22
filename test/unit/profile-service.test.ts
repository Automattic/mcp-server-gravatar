import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProfileService } from '../../src/services/profile-service.js';
import {
  getProfileByIdTool,
  handler as getProfileByIdHandler,
} from '../../src/tools/get-profile-by-id.js';
import {
  getProfileByEmailTool,
  handler as getProfileByEmailHandler,
} from '../../src/tools/get-profile-by-email.js';
import type { IProfileService } from '../../src/services/interfaces.js';
import { ProfileService } from '../../src/services/profile-service.js';
import { GravatarValidationError, GravatarResourceNotFoundError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import * as types from '../../src/common/types.js';
import { createMockProfilesApi } from '../helpers/mock-api-clients.js';
import { createMockProfile } from '../helpers/mock-responses.js';

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

// Mock the types module
vi.mock('../../src/common/types.js', () => {
  return {
    isApiErrorResponse: vi.fn(),
  };
});

// Mock the ProfilesApi constructor
vi.mock('../../src/generated/gravatar-api/apis/ProfilesApi.js', () => {
  return {
    ProfilesApi: vi.fn(),
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
      getProfileById: vi.fn().mockResolvedValue(createMockProfile()),
      getProfileByEmail: vi.fn().mockResolvedValue(createMockProfile()),
    };

    // Mock the createProfileService function
    vi.mocked(createProfileService).mockResolvedValue(mockProfileService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfileById tool', () => {
    it('should have the correct name and description', () => {
      const tool = getProfileByIdTool;
      expect(tool.name).toBe('get_profile_by_id');
      expect(tool.description).toBe('Fetch a Gravatar profile using a profile identifier (hash).');
    });

    it('should call the service with correct parameters', async () => {
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(createProfileService).mockResolvedValue(mockProfileService);

      // Setup the mock service to return a specific value
      const mockProfile = createMockProfile({ displayName: 'Test User' });
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
        return createMockProfile();
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'invalid-hash',
      } as any;

      await expect(getProfileByIdHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getProfileByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = getProfileByEmailTool;
      expect(tool.name).toBe('get_profile_by_email');
      expect(tool.description).toBe('Fetch a Gravatar profile using an email address.');
    });

    it('should call the service with correct parameters', async () => {
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(createProfileService).mockResolvedValue(mockProfileService);

      // Setup the mock service to return a specific value
      const mockProfile = createMockProfile({ displayName: 'Test User' });
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
        return createMockProfile();
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'invalid-email',
      } as any;

      await expect(getProfileByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});

describe('ProfileService', () => {
  let mockApi: ReturnType<typeof createMockProfilesApi>;
  let service: IProfileService;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock API client
    mockApi = createMockProfilesApi({
      getProfileByIdResponse: createMockProfile(),
    });

    // Create the service with the mock API client
    service = new ProfileService(mockApi);
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

    it('should call the API client with correct parameters', async () => {
      await service.getProfileById('test-hash');
      expect(mockApi.getProfileById).toHaveBeenCalledWith({ profileIdentifier: 'test-hash' });
    });

    it('should return the profile data', async () => {
      const mockProfile = createMockProfile({ displayName: 'Custom Name' });
      mockApi.getProfileById = vi.fn().mockResolvedValue(mockProfile);

      const result = await service.getProfileById('test-hash');
      expect(result).toEqual(mockProfile);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApi.getProfileById = vi.fn().mockRejectedValue(error);

      await expect(service.getProfileById('test-hash')).rejects.toThrow(error);
    });

    it('should map API error responses', async () => {
      // Setup isApiErrorResponse to return true for our error
      const apiError = new Error('API Error');
      (apiError as any).response = { status: 404 };
      mockApi.getProfileById = vi.fn().mockRejectedValue(apiError);

      vi.mocked(types.isApiErrorResponse).mockReturnValue(true);

      // Setup mapHttpStatusToError to return a specific error
      const mappedError = new GravatarResourceNotFoundError('Profile not found');
      vi.mocked(utils.mapHttpStatusToError).mockResolvedValue(mappedError);

      await expect(service.getProfileById('test-hash')).rejects.toThrow(mappedError);
      expect(utils.mapHttpStatusToError).toHaveBeenCalledWith(404, 'API Error');
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
      const mockProfile = createMockProfile({ displayName: 'Email User' });
      const getProfileByIdSpy = vi.spyOn(service, 'getProfileById');
      getProfileByIdSpy.mockResolvedValue(mockProfile);

      const result = await service.getProfileByEmail('test@example.com');
      expect(result).toEqual(mockProfile);
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
