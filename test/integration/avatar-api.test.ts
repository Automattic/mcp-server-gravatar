import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as utils from '../../src/common/utils.js';
import { createAvatarService } from '../../src/services/avatar-service.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';
import fetch from 'node-fetch';

// Mock the fetch function
vi.mock('node-fetch');

describe('Avatar API Integration', () => {
  // Use a valid MD5 hash (32 characters) for testing
  const hash = '00000000000000000000000000000000';
  const email = 'test@example.com';

  // Create a mock avatar buffer
  const mockAvatarBuffer = Buffer.from('This is a mock avatar image');

  // Create a mock Response object
  const createMockResponse = (status = 200, statusText = 'OK') => {
    const response = {
      ok: status >= 200 && status < 300,
      status,
      statusText,
      arrayBuffer: vi.fn().mockResolvedValue(mockAvatarBuffer),
    };
    return response;
  };

  // We need to use any here because our mock doesn't implement the full Response interface
  // This type is not used directly but helps document the code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  type _MockResponse = any;

  // Create a service with the mocked fetch
  let avatarService;

  beforeEach(() => {
    // Reset the fetch mock
    vi.mocked(fetch).mockReset();

    // Create a new service instance for each test
    avatarService = createAvatarService(fetch);
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('getAvatarById', () => {
    it('should fetch and return avatar data', async () => {
      // Set up the mock response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

      // Call the function
      const result = await avatarService.getAvatarById(hash);

      // Verify the mock was called
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle query parameters', async () => {
      // Set up the mock response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

      // Call the function with parameters
      const result = await avatarService.getAvatarById(
        hash,
        200,
        DefaultAvatarOption.IDENTICON,
        true,
        Rating.PG
      );

      // Verify the mock was called with the correct URL including query parameters
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}?s=200&d=identicon&f=y&r=pg`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle errors', async () => {
      // Set up the mock response with an error status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fetch).mockResolvedValue(createMockResponse(404, 'Not Found') as any);

      // Call the function and expect it to throw
      await expect(avatarService.getAvatarById(hash)).rejects.toThrow();

      // Verify the mock was called
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );
    });
  });

  describe('getAvatarByEmail', () => {
    it('should fetch and return avatar data', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Set up the mock response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

      // Call the function
      const result = await avatarService.getAvatarByEmail(email);

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle query parameters', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Set up the mock response
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

      // Call the function with parameters
      const result = await avatarService.getAvatarByEmail(
        email,
        200,
        DefaultAvatarOption.IDENTICON,
        true,
        Rating.PG
      );

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}?s=200&d=identicon&f=y&r=pg`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle errors', async () => {
      // Mock the generateIdentifierFromEmail function to return our test hash
      vi.spyOn(utils, 'generateIdentifierFromEmail').mockReturnValue(hash);

      // Set up the mock response with an error status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fetch).mockResolvedValue(createMockResponse(404, 'Not Found') as any);

      // Call the function and expect it to throw
      await expect(avatarService.getAvatarByEmail(email)).rejects.toThrow();

      // Verify the mocks were called
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith(email);
      expect(fetch).toHaveBeenCalledWith(
        `https://secure.gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String)
          })
        })
      );
    });
  });
});
