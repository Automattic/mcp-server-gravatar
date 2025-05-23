import { describe, it, expect } from 'vitest';
import { getAvatarByIdSchema } from '../../src/tools/get-avatar-by-id.js';
import { getAvatarByEmailSchema } from '../../src/tools/get-avatar-by-email.js';

describe('Rating Validation', () => {
  const validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const validEmail = 'test@example.com';

  describe('getAvatarById rating validation', () => {
    it('should accept valid lowercase ratings (normalized to uppercase)', () => {
      const testCases = [
        { input: 'g', expected: 'G' },
        { input: 'pg', expected: 'PG' },
        { input: 'r', expected: 'R' },
        { input: 'x', expected: 'X' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getAvatarByIdSchema.parse({
          avatarIdentifier: validHash,
          rating: input,
        });
        expect(result.rating).toBe(expected);
      });
    });

    it('should accept valid uppercase ratings', () => {
      const validRatings = ['G', 'PG', 'R', 'X'];

      validRatings.forEach(rating => {
        const result = getAvatarByIdSchema.parse({
          avatarIdentifier: validHash,
          rating,
        });
        expect(result.rating).toBe(rating);
      });
    });

    it('should accept mixed case ratings (normalized to uppercase)', () => {
      const testCases = [
        { input: 'Pg', expected: 'PG' },
        { input: 'pG', expected: 'PG' },
        { input: 'g', expected: 'G' },
        { input: 'G', expected: 'G' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getAvatarByIdSchema.parse({
          avatarIdentifier: validHash,
          rating: input,
        });
        expect(result.rating).toBe(expected);
      });
    });

    it('should reject invalid ratings', () => {
      const invalidRatings = ['t', 'invalid', 'z', 'nc17'];

      invalidRatings.forEach(rating => {
        expect(() => {
          getAvatarByIdSchema.parse({
            avatarIdentifier: validHash,
            rating,
          });
        }).toThrow();
      });
    });

    it('should handle undefined rating', () => {
      const result = getAvatarByIdSchema.parse({
        avatarIdentifier: validHash,
      });
      expect(result.rating).toBeUndefined();
    });

    it('should handle empty string rating (converted to undefined)', () => {
      const result = getAvatarByIdSchema.parse({
        avatarIdentifier: validHash,
        rating: '',
      });
      expect(result.rating).toBeUndefined();
    });
  });

  describe('getAvatarByEmail rating validation', () => {
    it('should accept valid lowercase ratings (normalized to uppercase)', () => {
      const testCases = [
        { input: 'g', expected: 'G' },
        { input: 'pg', expected: 'PG' },
        { input: 'r', expected: 'R' },
        { input: 'x', expected: 'X' },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = getAvatarByEmailSchema.parse({
          email: validEmail,
          rating: input,
        });
        expect(result.rating).toBe(expected);
      });
    });

    it('should accept valid uppercase ratings', () => {
      const validRatings = ['G', 'PG', 'R', 'X'];

      validRatings.forEach(rating => {
        const result = getAvatarByEmailSchema.parse({
          email: validEmail,
          rating,
        });
        expect(result.rating).toBe(rating);
      });
    });

    it('should reject invalid ratings', () => {
      const invalidRatings = ['t', 'invalid', 'z', 'nc17'];

      invalidRatings.forEach(rating => {
        expect(() => {
          getAvatarByEmailSchema.parse({
            email: validEmail,
            rating,
          });
        }).toThrow();
      });
    });

    it('should handle undefined rating', () => {
      const result = getAvatarByEmailSchema.parse({
        email: validEmail,
      });
      expect(result.rating).toBeUndefined();
    });

    it('should handle empty string rating (converted to undefined)', () => {
      const result = getAvatarByEmailSchema.parse({
        email: validEmail,
        rating: '',
      });
      expect(result.rating).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle non-string rating values', () => {
      expect(() => {
        getAvatarByIdSchema.parse({
          avatarIdentifier: validHash,
          rating: 123,
        });
      }).toThrow();
    });

    it('should handle null rating', () => {
      expect(() => {
        getAvatarByIdSchema.parse({
          avatarIdentifier: validHash,
          rating: null,
        });
      }).toThrow();
    });
  });
});
