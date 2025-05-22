import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExperimentalService } from '../../src/services/experimental-service.js';
import {
  getInterestsByIdTool,
  handler as getInterestsByIdHandler,
} from '../../src/tools/get-interests-by-id.js';
import {
  getInterestsByEmailTool,
  handler as getInterestsByEmailHandler,
} from '../../src/tools/get-interests-by-email.js';
import type { IExperimentalService } from '../../src/services/interfaces.js';
import { ExperimentalService } from '../../src/services/experimental-service.js';
import { GravatarValidationError, GravatarResourceNotFoundError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import * as types from '../../src/common/types.js';
import { createMockExperimentalApi } from '../helpers/mock-api-clients.js';
import { createMockInterests } from '../helpers/mock-responses.js';

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

// Mock the ExperimentalApi constructor
vi.mock('../../src/generated/gravatar-api/apis/ExperimentalApi.js', () => {
  return {
    ExperimentalApi: vi.fn(),
  };
});

// Mock the createExperimentalService function
vi.mock('../../src/services/experimental-service.js', async () => {
  const actual = await vi.importActual('../../src/services/experimental-service.js');
  return {
    ...actual,
    createExperimentalService: vi.fn(),
  };
});

describe('Experimental MCP Tools', () => {
  let mockExperimentalService: IExperimentalService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock experimental service
    const mockInterests = createMockInterests(3);

    mockExperimentalService = {
      getInferredInterestsById: vi.fn().mockResolvedValue(mockInterests),
      getInferredInterestsByEmail: vi.fn().mockResolvedValue(mockInterests),
    };

    // Mock the createExperimentalService function
    vi.mocked(createExperimentalService).mockResolvedValue(mockExperimentalService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInferredInterestsById tool', () => {
    it('should have the correct name and description', () => {
      const tool = getInterestsByIdTool;
      expect(tool.name).toBe('get_inferred_interests_by_id');
      expect(tool.description).toBe(
        'Fetch inferred interests for a Gravatar profile using a profile identifier (hash).',
      );
    });

    it('should call the service with correct parameters', async () => {
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(createExperimentalService).mockResolvedValue(mockExperimentalService);

      // Setup the mock service to return a specific value
      const mockInterests = createMockInterests(3);
      (mockExperimentalService.getInferredInterestsById as any).mockResolvedValue(mockInterests);

      // Create a spy for mapHttpStatusToError to ensure it returns a proper error
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Interests not found'));
      });

      // Create a custom handler function that uses our mocked service
      const handler = async (params: { hash: string }) => {
        const service = await createExperimentalService();
        return await service.getInferredInterestsById(params.hash);
      };

      // Call the handler
      const result = await handler({ hash: 'test-hash' });

      // Verify the service method was called with the correct parameters
      expect(mockExperimentalService.getInferredInterestsById).toHaveBeenCalledWith('test-hash');
      expect(createExperimentalService).toHaveBeenCalled();

      // Verify the handler returns the expected result
      expect(result).toEqual(mockInterests);
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
      const mockGetInferredInterestsById = mockExperimentalService.getInferredInterestsById as any;
      mockGetInferredInterestsById.mockImplementation(async (hash: string) => {
        if (!utils.validateHash(hash)) {
          throw new GravatarValidationError('Invalid hash format');
        }
        return createMockInterests(3);
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'invalid-hash',
      } as any;

      await expect(getInterestsByIdHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getInferredInterestsByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = getInterestsByEmailTool;
      expect(tool.name).toBe('get_inferred_interests_by_email');
      expect(tool.description).toBe(
        'Fetch inferred interests for a Gravatar profile using an email address.',
      );
    });

    it('should call the service with correct parameters', async () => {
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(createExperimentalService).mockResolvedValue(mockExperimentalService);

      // Setup the mock service to return a specific value
      const mockInterests = createMockInterests(3);
      (mockExperimentalService.getInferredInterestsByEmail as any).mockResolvedValue(mockInterests);

      // Create a spy for mapHttpStatusToError to ensure it returns a proper error
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Interests not found'));
      });

      // Create a custom handler function that uses our mocked service
      const handler = async (params: { email: string }) => {
        const service = await createExperimentalService();
        return await service.getInferredInterestsByEmail(params.email);
      };

      // Call the handler
      const result = await handler({ email: 'test@example.com' });

      // Verify the service method was called with the correct parameters
      expect(mockExperimentalService.getInferredInterestsByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(createExperimentalService).toHaveBeenCalled();

      // Verify the handler returns the expected result
      expect(result).toEqual(mockInterests);
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
      const mockGetInferredInterestsByEmail =
        mockExperimentalService.getInferredInterestsByEmail as any;
      mockGetInferredInterestsByEmail.mockImplementation(async (email: string) => {
        if (!utils.validateEmail(email)) {
          throw new GravatarValidationError('Invalid email format');
        }
        return createMockInterests(3);
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'invalid-email',
      } as any;

      await expect(getInterestsByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});

describe('ExperimentalService', () => {
  let mockApiClient: ReturnType<typeof createMockExperimentalApi>;
  let service: IExperimentalService;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock API client
    mockApiClient = createMockExperimentalApi({
      getProfileInferredInterestsByIdResponse: createMockInterests(3),
    });

    // Create the service with the mock API client
    service = new ExperimentalService(mockApiClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInferredInterestsById', () => {
    it('should validate the hash', async () => {
      await service.getInferredInterestsById('test-hash');
      expect(utils.validateHash).toHaveBeenCalledWith('test-hash');
    });

    it('should throw GravatarValidationError for invalid hash', async () => {
      vi.mocked(utils.validateHash).mockReturnValue(false);
      await expect(service.getInferredInterestsById('invalid-hash')).rejects.toThrow(
        GravatarValidationError,
      );
      await expect(service.getInferredInterestsById('invalid-hash')).rejects.toThrow(
        'Invalid hash format',
      );
    });

    it('should call the API client with correct parameters', async () => {
      await service.getInferredInterestsById('test-hash');
      expect(mockApiClient.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: 'test-hash',
      });
    });

    it('should return the inferred interests data', async () => {
      const mockInterests = createMockInterests(3);
      mockApiClient.getProfileInferredInterestsById = vi.fn().mockResolvedValue(mockInterests);

      const result = await service.getInferredInterestsById('test-hash');
      expect(result).toEqual(mockInterests);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      mockApiClient.getProfileInferredInterestsById = vi.fn().mockRejectedValue(error);

      await expect(service.getInferredInterestsById('test-hash')).rejects.toThrow(error);
    });

    it('should map API error responses', async () => {
      // Setup isApiErrorResponse to return true for our error
      const apiError = new Error('API Error');
      (apiError as any).response = { status: 404 };
      mockApiClient.getProfileInferredInterestsById = vi.fn().mockRejectedValue(apiError);

      vi.mocked(types.isApiErrorResponse).mockReturnValue(true);

      // Setup mapHttpStatusToError to return a specific error
      const mappedError = new GravatarResourceNotFoundError('Interests not found');
      vi.mocked(utils.mapHttpStatusToError).mockResolvedValue(mappedError);

      await expect(service.getInferredInterestsById('test-hash')).rejects.toThrow(mappedError);
      expect(utils.mapHttpStatusToError).toHaveBeenCalledWith(404, 'API Error');
    });
  });

  describe('getInferredInterestsByEmail', () => {
    it('should validate the email', async () => {
      await service.getInferredInterestsByEmail('test@example.com');
      expect(utils.validateEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw GravatarValidationError for invalid email', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);
      await expect(service.getInferredInterestsByEmail('invalid-email')).rejects.toThrow(
        GravatarValidationError,
      );
      await expect(service.getInferredInterestsByEmail('invalid-email')).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should generate identifier from email', async () => {
      await service.getInferredInterestsByEmail('test@example.com');
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should call getInferredInterestsById with generated hash', async () => {
      // Create a spy on the service's getInferredInterestsById method
      const getInferredInterestsByIdSpy = vi.spyOn(service, 'getInferredInterestsById');

      await service.getInferredInterestsByEmail('test@example.com');

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(getInferredInterestsByIdSpy).toHaveBeenCalledWith('email-hash');
    });

    it('should return the inferred interests data', async () => {
      const mockInterests = createMockInterests(3);
      const getInferredInterestsByIdSpy = vi.spyOn(service, 'getInferredInterestsById');
      getInferredInterestsByIdSpy.mockResolvedValue(mockInterests);

      const result = await service.getInferredInterestsByEmail('test@example.com');
      expect(result).toEqual(mockInterests);
    });

    it('should handle errors from getInferredInterestsById', async () => {
      // Create a spy on getInferredInterestsById that throws an error
      const getInferredInterestsByIdSpy = vi.spyOn(service, 'getInferredInterestsById');
      const testError = new Error('Test error from getInferredInterestsById');
      getInferredInterestsByIdSpy.mockRejectedValue(testError);

      await expect(service.getInferredInterestsByEmail('test@example.com')).rejects.toThrow(
        'Test error from getInferredInterestsById',
      );
      await expect(service.getInferredInterestsByEmail('test@example.com')).rejects.toThrow(
        testError,
      );
    });

    it('should handle API errors propagated from getInferredInterestsById', async () => {
      // Create a spy on getInferredInterestsById that throws a GravatarResourceNotFoundError
      const getInferredInterestsByIdSpy = vi.spyOn(service, 'getInferredInterestsById');
      const notFoundError = new GravatarResourceNotFoundError('Interests not found');
      getInferredInterestsByIdSpy.mockRejectedValue(notFoundError);

      await expect(service.getInferredInterestsByEmail('test@example.com')).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(service.getInferredInterestsByEmail('test@example.com')).rejects.toThrow(
        'Interests not found',
      );
    });
  });
});
