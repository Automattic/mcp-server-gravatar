import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tools, handlers } from '../../src/tools/index.js';
import {
  getProfileByIdTool,
  handler as getProfileByIdHandler,
} from '../../src/tools/get-profile-by-id.js';
import {
  getProfileByEmailTool,
  handler as getProfileByEmailHandler,
} from '../../src/tools/get-profile-by-email.js';
import {
  getInterestsByIdTool,
  handler as getInterestsByIdHandler,
} from '../../src/tools/get-interests-by-id.js';
import {
  getInterestsByEmailTool,
  handler as getInterestsByEmailHandler,
} from '../../src/tools/get-interests-by-email.js';
import {
  getAvatarByIdTool,
  handler as getAvatarByIdHandler,
} from '../../src/tools/get-avatar-by-id.js';
import {
  getAvatarByEmailTool,
  handler as getAvatarByEmailHandler,
} from '../../src/tools/get-avatar-by-email.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';

// Mock the service modules
vi.mock('../../src/services/profile-service.js', async () => {
  const actual = await vi.importActual('../../src/services/profile-service.js');
  return {
    ...actual,
    getDefaultProfileService: vi.fn(),
  };
});

vi.mock('../../src/services/experimental-service.js', async () => {
  const actual = await vi.importActual('../../src/services/experimental-service.js');
  return {
    ...actual,
    getDefaultExperimentalService: vi.fn(),
  };
});

vi.mock('../../src/services/gravatar-image-service.js', async () => {
  const actual = await vi.importActual('../../src/services/gravatar-image-service.js');
  return {
    ...actual,
    getDefaultAvatarService: vi.fn(),
  };
});

// Import the mocked services
import { getDefaultProfileService } from '../../src/services/profile-service.js';
import { getDefaultExperimentalService } from '../../src/services/experimental-service.js';
import { getDefaultAvatarService } from '../../src/services/gravatar-image-service.js';

describe('Tools Index', () => {
  it('should export all tools', () => {
    expect(tools).toHaveLength(6);
    expect(tools).toContain(getProfileByIdTool);
    expect(tools).toContain(getProfileByEmailTool);
    expect(tools).toContain(getInterestsByIdTool);
    expect(tools).toContain(getInterestsByEmailTool);
    expect(tools).toContain(getAvatarByIdTool);
    expect(tools).toContain(getAvatarByEmailTool);
  });

  it('should export handlers map with correct mappings', () => {
    expect(Object.keys(handlers)).toHaveLength(6);
    expect(handlers[getProfileByIdTool.name]).toBe(getProfileByIdHandler);
    expect(handlers[getProfileByEmailTool.name]).toBe(getProfileByEmailHandler);
    expect(handlers[getInterestsByIdTool.name]).toBe(getInterestsByIdHandler);
    expect(handlers[getInterestsByEmailTool.name]).toBe(getInterestsByEmailHandler);
    expect(handlers[getAvatarByIdTool.name]).toBe(getAvatarByIdHandler);
    expect(handlers[getAvatarByEmailTool.name]).toBe(getAvatarByEmailHandler);
  });
});

describe('Profile Tool Handlers', () => {
  let mockProfileService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock profile service
    mockProfileService = {
      getProfileById: vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
      getProfileByEmail: vi.fn().mockResolvedValue({
        hash: 'email-hash',
        displayName: 'Email User',
        profileUrl: 'https://gravatar.com/emailuser',
      }),
    };

    // Mock the getDefaultProfileService function
    vi.mocked(getDefaultProfileService).mockResolvedValue(mockProfileService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfileById handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { hash: 'test-hash' };
      const result = await getProfileByIdHandler(params);

      expect(getDefaultProfileService).toHaveBeenCalled();
      expect(mockProfileService.getProfileById).toHaveBeenCalledWith('test-hash');

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                hash: 'test-hash',
                displayName: 'Test User',
                profileUrl: 'https://gravatar.com/testuser',
              },
              null,
              2,
            ),
          },
        ],
      });
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockProfileService.getProfileById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { hash: 'invalid-hash' };
      await expect(getProfileByIdHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getProfileByIdHandler(params)).rejects.toThrow('Invalid hash format');
    });
  });

  describe('getProfileByEmail handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { email: 'test@example.com' };
      const result = await getProfileByEmailHandler(params);

      expect(getDefaultProfileService).toHaveBeenCalled();
      expect(mockProfileService.getProfileByEmail).toHaveBeenCalledWith('test@example.com');

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                hash: 'email-hash',
                displayName: 'Email User',
                profileUrl: 'https://gravatar.com/emailuser',
              },
              null,
              2,
            ),
          },
        ],
      });
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockProfileService.getProfileByEmail.mockRejectedValue(
        new GravatarValidationError('Invalid email format'),
      );

      const params = { email: 'invalid-email' };
      await expect(getProfileByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getProfileByEmailHandler(params)).rejects.toThrow('Invalid email format');
    });
  });
});

describe('Experimental Tool Handlers', () => {
  let mockExperimentalService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock experimental service
    mockExperimentalService = {
      getInferredInterestsById: vi.fn().mockResolvedValue([
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
      ]),
      getInferredInterestsByEmail: vi.fn().mockResolvedValue([
        { id: 3, name: 'typescript' },
        { id: 4, name: 'react' },
      ]),
    };

    // Mock the getDefaultExperimentalService function
    vi.mocked(getDefaultExperimentalService).mockResolvedValue(mockExperimentalService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInterestsById handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { hash: 'test-hash' };
      const result = await getInterestsByIdHandler(params);

      expect(getDefaultExperimentalService).toHaveBeenCalled();
      expect(mockExperimentalService.getInferredInterestsById).toHaveBeenCalledWith('test-hash');

      // Verify response format is correct (without checking exact content)
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toBe(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to verify it contains the expected data
      const parsedText = JSON.parse(result.content[0].text);
      expect(parsedText).toContain('programming');
      expect(parsedText).toContain('javascript');
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockExperimentalService.getInferredInterestsById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { hash: 'invalid-hash' };
      await expect(getInterestsByIdHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getInterestsByIdHandler(params)).rejects.toThrow('Invalid hash format');
    });
  });

  describe('getInterestsByEmail handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { email: 'test@example.com' };
      const result = await getInterestsByEmailHandler(params);

      expect(getDefaultExperimentalService).toHaveBeenCalled();
      expect(mockExperimentalService.getInferredInterestsByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );

      // Verify response format is correct (without checking exact content)
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toBe(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to verify it contains the expected data
      const parsedText = JSON.parse(result.content[0].text);
      expect(parsedText).toContain('typescript');
      expect(parsedText).toContain('react');
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockExperimentalService.getInferredInterestsByEmail.mockRejectedValue(
        new GravatarValidationError('Invalid email format'),
      );

      const params = { email: 'invalid-email' };
      await expect(getInterestsByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getInterestsByEmailHandler(params)).rejects.toThrow('Invalid email format');
    });
  });
});

describe('Avatar Tool Handlers', () => {
  let mockAvatarService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock avatar service
    mockAvatarService = {
      getAvatarById: vi.fn().mockResolvedValue(Buffer.from('mock-avatar-data')),
      getAvatarByEmail: vi.fn().mockResolvedValue(Buffer.from('mock-email-avatar-data')),
    };

    // Mock the getDefaultAvatarService function
    vi.mocked(getDefaultAvatarService).mockReturnValue(mockAvatarService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = {
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      };

      const result = await getAvatarByIdHandler(params);

      expect(getDefaultAvatarService).toHaveBeenCalled();
      expect(mockAvatarService.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        200,
        DefaultAvatarOption.IDENTICON,
        true,
        Rating.PG,
      );

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from('mock-avatar-data').toString('base64'),
            mimeType: 'image/png',
          },
        ],
      });
    });

    it('should handle minimal parameters', async () => {
      const params = { hash: 'test-hash' };

      await getAvatarByIdHandler(params);

      expect(mockAvatarService.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockAvatarService.getAvatarById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { hash: 'invalid-hash' };
      await expect(getAvatarByIdHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getAvatarByIdHandler(params)).rejects.toThrow('Invalid hash format');
    });
  });

  describe('getAvatarByEmail handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = {
        email: 'test@example.com',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      };

      const result = await getAvatarByEmailHandler(params);

      expect(getDefaultAvatarService).toHaveBeenCalled();
      expect(mockAvatarService.getAvatarByEmail).toHaveBeenCalledWith(
        'test@example.com',
        200,
        DefaultAvatarOption.IDENTICON,
        true,
        Rating.PG,
      );

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from('mock-email-avatar-data').toString('base64'),
            mimeType: 'image/png',
          },
        ],
      });
    });

    it('should handle minimal parameters', async () => {
      const params = { email: 'test@example.com' };

      await getAvatarByEmailHandler(params);

      expect(mockAvatarService.getAvatarByEmail).toHaveBeenCalledWith(
        'test@example.com',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockAvatarService.getAvatarByEmail.mockRejectedValue(
        new GravatarValidationError('Invalid email format'),
      );

      const params = { email: 'invalid-email' };
      await expect(getAvatarByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getAvatarByEmailHandler(params)).rejects.toThrow('Invalid email format');
    });
  });
});
