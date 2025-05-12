import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createProfileService } from '../../src/services/profile-service.js';
import type { IProfileClient, IProfileService } from '../../src/services/interfaces.js';
import { GravatarValidationError, GravatarResourceNotFoundError } from '../../src/common/errors.js';
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
        profileUrl: 'https://gravatar.com/testuser'
      })
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
        profileUrl: 'https://gravatar.com/testuser'
      });
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (error as any).response = { status: 404 };

      mockClient.getProfileById = vi.fn().mockRejectedValue(error);
      vi.mocked(utils.mapHttpStatusToError).mockImplementation((_status, _message) => {
        return Promise.resolve(new GravatarResourceNotFoundError('Profile not found'));
      });

      await expect(service.getProfileById('test-hash')).rejects.toThrow(GravatarResourceNotFoundError);
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
      await expect(service.getProfileByEmail('invalid-email')).rejects.toThrow(GravatarValidationError);
      await expect(service.getProfileByEmail('invalid-email')).rejects.toThrow('Invalid email format');
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
        profileUrl: 'https://gravatar.com/testuser'
      });
    });
  });
});
