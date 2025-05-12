import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createExperimentalService } from '../../src/services/experimental-service.js';
import type { IExperimentalClient, IExperimentalService } from '../../src/services/interfaces.js';
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
    mapHttpStatusToError: vi.fn()
  };
});

describe('ExperimentalService', () => {
  let mockClient: IExperimentalClient;
  let service: IExperimentalService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock client
    mockClient = {
      getProfileInferredInterestsById: vi.fn().mockResolvedValue([
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
        { id: 3, name: 'typescript' }
      ])
    };

    // Create the service with the mock client
    service = createExperimentalService(mockClient);
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
      await expect(service.getInferredInterestsById('invalid-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getInferredInterestsById('invalid-hash')).rejects.toThrow('Invalid hash format');
    });

    it('should call the client with correct parameters', async () => {
      await service.getInferredInterestsById('test-hash');
      expect(mockClient.getProfileInferredInterestsById).toHaveBeenCalledWith({ profileIdentifier: 'test-hash' });
    });

    it('should return the inferred interests data', async () => {
      const result = await service.getInferredInterestsById('test-hash');
      expect(result).toEqual([
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
        { id: 3, name: 'typescript' }
      ]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error') as unknown as ApiErrorResponse;
      error.response = { status: 404 };

      mockClient.getProfileInferredInterestsById = vi.fn().mockRejectedValue(error);
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Interests not found'));
      });

      await expect(service.getInferredInterestsById('test-hash')).rejects.toThrow(GravatarResourceNotFoundError);
      await expect(service.getInferredInterestsById('test-hash')).rejects.toThrow('Interests not found');
    });
  });

  describe('getInferredInterestsByEmail', () => {
    it('should validate the email', async () => {
      await service.getInferredInterestsByEmail('test@example.com');
      expect(utils.validateEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw GravatarValidationError for invalid email', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);
      await expect(service.getInferredInterestsByEmail('invalid-email')).rejects.toThrow(GravatarValidationError);
      await expect(service.getInferredInterestsByEmail('invalid-email')).rejects.toThrow('Invalid email format');
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
        { id: 3, name: 'typescript' }
      ]);
    });
  });
});
