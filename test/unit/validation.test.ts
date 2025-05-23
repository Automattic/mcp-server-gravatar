import { describe, it, expect } from 'vitest';
import { getAvatarByIdSchema } from '../../src/tools/get-avatar-by-id.js';
import { getAvatarByEmailSchema } from '../../src/tools/get-avatar-by-email.js';

describe('Schema Validation', () => {
  const validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const validEmail = 'test@example.com';

  describe('Rating validation (shared across avatar tools)', () => {
    it('should accept and normalize valid ratings', () => {
      const testCases = [
        { input: 'g', expected: 'G' },
        { input: 'pg', expected: 'PG' },
        { input: 'r', expected: 'R' },
        { input: 'x', expected: 'X' },
        { input: 'G', expected: 'G' },
        { input: 'PG', expected: 'PG' },
        { input: 'R', expected: 'R' },
        { input: 'X', expected: 'X' },
        { input: 'Pg', expected: 'PG' },
        { input: 'pG', expected: 'PG' },
      ];

      testCases.forEach(({ input, expected }) => {
        // Test with avatar by ID schema
        const resultById = getAvatarByIdSchema.parse({
          avatarIdentifier: validHash,
          rating: input,
        });
        expect(resultById.rating).toBe(expected);

        // Test with avatar by email schema
        const resultByEmail = getAvatarByEmailSchema.parse({
          email: validEmail,
          rating: input,
        });
        expect(resultByEmail.rating).toBe(expected);
      });
    });

    it('should reject invalid ratings', () => {
      const invalidRatings = ['t', 'invalid', 'z', 'nc17', 123, null];

      invalidRatings.forEach(rating => {
        // Test with avatar by ID schema
        expect(() => {
          getAvatarByIdSchema.parse({
            avatarIdentifier: validHash,
            rating,
          });
        }).toThrow();

        // Test with avatar by email schema
        expect(() => {
          getAvatarByEmailSchema.parse({
            email: validEmail,
            rating,
          });
        }).toThrow();
      });
    });

    it('should handle undefined and empty string ratings', () => {
      // Test undefined rating
      const resultByIdUndefined = getAvatarByIdSchema.parse({
        avatarIdentifier: validHash,
      });
      expect(resultByIdUndefined.rating).toBeUndefined();

      const resultByEmailUndefined = getAvatarByEmailSchema.parse({
        email: validEmail,
      });
      expect(resultByEmailUndefined.rating).toBeUndefined();

      // Test empty string rating (converted to undefined)
      const resultByIdEmpty = getAvatarByIdSchema.parse({
        avatarIdentifier: validHash,
        rating: '',
      });
      expect(resultByIdEmpty.rating).toBeUndefined();

      const resultByEmailEmpty = getAvatarByEmailSchema.parse({
        email: validEmail,
        rating: '',
      });
      expect(resultByEmailEmpty.rating).toBeUndefined();
    });
  });
});
