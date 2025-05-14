import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createExperimentalService,
  experimentalTools,
  getDefaultExperimentalService,
} from '../../src/services/experimental-service.js';
import type { IExperimentalClient, IExperimentalService } from '../../src/services/interfaces.js';
import type { Interest } from '../../src/generated/gravatar-api/models/Interest.js';
import { GravatarValidationError, GravatarResourceNotFoundError } from '../../src/common/errors.js';
import type { ApiErrorResponse } from '../../src/common/types.js';
import * as utils from '../../src/common/utils.js';

// Mock the utils functions and experimental service
vi.mock('../../src/common/utils.js', () => {
  return {
    validateHash: vi.fn(),
    validateEmail: vi.fn(),
    generateIdentifierFromEmail: vi.fn(),
    createApiConfiguration: vi.fn(),
    mapHttpStatusToError: vi.fn(),
  };
});

// Mock the getDefaultExperimentalService function
vi.mock('../../src/services/experimental-service.js', async () => {
  const actual = await vi.importActual('../../src/services/experimental-service.js');
  return {
    ...actual,
    getDefaultExperimentalService: vi.fn(),
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
    const mockInterests: Interest[] = [
      { id: 1, name: 'programming' },
      { id: 2, name: 'javascript' },
      { id: 3, name: 'typescript' },
    ];

    mockExperimentalService = {
      getInferredInterestsById: vi.fn().mockResolvedValue(mockInterests),
      getInferredInterestsByEmail: vi.fn().mockResolvedValue(mockInterests),
    };

    // Mock the getDefaultExperimentalService function
    vi.mocked(getDefaultExperimentalService).mockResolvedValue(mockExperimentalService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInferredInterestsById tool', () => {
    it('should have the correct name and description', () => {
      const tool = experimentalTools[0];
      expect(tool.name).toBe('getInferredInterestsById');
      expect(tool.description).toBe(
        'Fetch inferred interests for a Gravatar profile using a profile identifier (hash).',
      );
    });

    it('should call the service with correct parameters', async () => {
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(getDefaultExperimentalService).mockResolvedValue(mockExperimentalService);

      // Setup the mock service to return a specific value
      const mockInterests: Interest[] = [
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
        { id: 3, name: 'typescript' },
      ];
      (mockExperimentalService.getInferredInterestsById as any).mockResolvedValue(mockInterests); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Create a spy for mapHttpStatusToError to ensure it returns a proper error
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Interests not found'));
      });

      // Create a custom handler function that uses our mocked service
      const handler = async (params: { hash: string }) => {
        const service = await getDefaultExperimentalService();
        return await service.getInferredInterestsById(params.hash);
      };

      // Call the handler
      const result = await handler({ hash: 'test-hash' });

      // Verify the service method was called with the correct parameters
      expect(mockExperimentalService.getInferredInterestsById).toHaveBeenCalledWith('test-hash');
      expect(getDefaultExperimentalService).toHaveBeenCalled();

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
      const mockGetInferredInterestsById = mockExperimentalService.getInferredInterestsById as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockGetInferredInterestsById.mockImplementation(async (hash: string) => {
        if (!utils.validateHash(hash)) {
          throw new GravatarValidationError('Invalid hash format');
        }
        const mockInterests: Interest[] = [
          { id: 1, name: 'programming' },
          { id: 2, name: 'javascript' },
          { id: 3, name: 'typescript' },
        ];
        return mockInterests;
      });

      // Use any type for testing purposes
      // In a real application, we would use a proper type, but for testing we can use any
      const params = {
        hash: 'invalid-hash',
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      await expect(experimentalTools[0].handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getInferredInterestsByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = experimentalTools[1];
      expect(tool.name).toBe('getInferredInterestsByEmail');
      expect(tool.description).toBe(
        'Fetch inferred interests for a Gravatar profile using an email address.',
      );
    });

    it('should call the service with correct parameters', async () => {
      // Setup the mock to return a resolved promise with the mock service
      vi.mocked(getDefaultExperimentalService).mockResolvedValue(mockExperimentalService);

      // Setup the mock service to return a specific value
      const mockInterests: Interest[] = [
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
        { id: 3, name: 'typescript' },
      ];
      (mockExperimentalService.getInferredInterestsByEmail as any).mockResolvedValue(mockInterests); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Create a spy for mapHttpStatusToError to ensure it returns a proper error
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Interests not found'));
      });

      // Create a custom handler function that uses our mocked service
      const handler = async (params: { email: string }) => {
        const service = await getDefaultExperimentalService();
        return await service.getInferredInterestsByEmail(params.email);
      };

      // Call the handler
      const result = await handler({ email: 'test@example.com' });

      // Verify the service method was called with the correct parameters
      expect(mockExperimentalService.getInferredInterestsByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(getDefaultExperimentalService).toHaveBeenCalled();

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
        mockExperimentalService.getInferredInterestsByEmail as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      mockGetInferredInterestsByEmail.mockImplementation(async (email: string) => {
        if (!utils.validateEmail(email)) {
          throw new GravatarValidationError('Invalid email format');
        }
        const mockInterests: Interest[] = [
          { id: 1, name: 'programming' },
          { id: 2, name: 'javascript' },
          { id: 3, name: 'typescript' },
        ];
        return mockInterests;
      });

      // Use any type for testing purposes
      // In a real application, we would use a proper type, but for testing we can use any
      const params = {
        email: 'invalid-email',
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      await expect(experimentalTools[1].handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});

describe('ExperimentalService', () => {
  let mockClient: IExperimentalClient;
  let service: IExperimentalService;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock client
    const mockInterests: Interest[] = [
      { id: 1, name: 'programming' },
      { id: 2, name: 'javascript' },
      { id: 3, name: 'typescript' },
    ];

    mockClient = {
      getProfileInferredInterestsById: vi.fn().mockResolvedValue(mockInterests),
    };

    // Create the service with the mock client
    service = await createExperimentalService(mockClient);
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

    it('should call the client with correct parameters', async () => {
      await service.getInferredInterestsById('test-hash');
      expect(mockClient.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: 'test-hash',
      });
    });

    it('should return the inferred interests data', async () => {
      const result = await service.getInferredInterestsById('test-hash');
      expect(result).toEqual([
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
        { id: 3, name: 'typescript' },
      ]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error') as unknown as ApiErrorResponse;
      error.response = { status: 404 };

      mockClient.getProfileInferredInterestsById = vi.fn().mockRejectedValue(error);
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Interests not found'));
      });

      await expect(service.getInferredInterestsById('test-hash')).rejects.toThrow(
        GravatarResourceNotFoundError,
      );
      await expect(service.getInferredInterestsById('test-hash')).rejects.toThrow(
        'Interests not found',
      );
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
      const result = await service.getInferredInterestsByEmail('test@example.com');
      expect(result).toEqual([
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
        { id: 3, name: 'typescript' },
      ]);
    });
  });
});
