import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvatarImageApi } from '../../src/apis/avatar-image-api.js';
import { DefaultAvatarOption } from '../../src/common/types.js';
import fetch from 'node-fetch';

// Mock the fetch function
vi.mock('node-fetch');

describe('AvatarImageApi Integration', () => {
  // Use a valid MD5 hash (32 characters) for testing
  const hash = '00000000000000000000000000000000';

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
  type _MockResponse = any;

  // Create an API instance for testing
  let avatarImageApi;

  beforeEach(() => {
    // Reset the fetch mock
    vi.mocked(fetch).mockReset();

    // Create a mock configuration
    const mockConfig = {
      headers: {
        'User-Agent': 'mcp-server-gravatar/v1.0.0',
      },
      basePath: 'https://gravatar.com/avatar',
    };

    // Create a new API instance for each test
    avatarImageApi = new AvatarImageApi(mockConfig as any);

    // Replace the global fetch with our mock
    global.fetch = fetch as any;
  });

  afterEach(() => {
    // Restore all mocks
    vi.restoreAllMocks();
  });

  describe('getAvatarById', () => {
    it('should fetch and return avatar data', async () => {
      // Set up the mock response
      vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

      // Call the function
      const result = await avatarImageApi.getAvatarById({ avatarIdentifier: hash });

      // Verify the mock was called
      expect(fetch).toHaveBeenCalledWith(
        `https://gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        }),
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle query parameters', async () => {
      // Set up the mock response
      vi.mocked(fetch).mockResolvedValue(createMockResponse() as any);

      // Call the function with parameters
      const result = await avatarImageApi.getAvatarById({
        avatarIdentifier: hash,
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: 'PG',
      });

      // Verify the mock was called with the correct URL including query parameters
      expect(fetch).toHaveBeenCalledWith(
        `https://gravatar.com/avatar/${hash}?s=200&d=identicon&f=y&r=PG`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        }),
      );

      // Verify the result
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle errors', async () => {
      // Set up the mock response with an error status
      vi.mocked(fetch).mockResolvedValue(createMockResponse(404, 'Not Found') as any);

      // Call the function and expect it to throw
      await expect(avatarImageApi.getAvatarById({ avatarIdentifier: hash })).rejects.toThrow();

      // Verify the mock was called
      expect(fetch).toHaveBeenCalledWith(
        `https://gravatar.com/avatar/${hash}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        }),
      );
    });
  });
});
