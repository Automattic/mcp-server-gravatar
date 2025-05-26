import { describe, it, expect } from 'vitest';
import { isError, getErrorMessage } from '../../src/common/errors.js';

describe('Error Utilities', () => {
  describe('isError', () => {
    it('should identify Error objects', () => {
      expect(isError(new Error('Test error'))).toBe(true);
      expect(isError(new TypeError('Type error'))).toBe(true);
      expect(isError(new ReferenceError('Reference error'))).toBe(true);
    });

    it('should reject non-Error objects', () => {
      expect(isError('string error')).toBe(false);
      expect(isError(123)).toBe(false);
      expect(isError({ message: 'fake error' })).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should extract message from Error subclasses', () => {
      const typeError = new TypeError('Type error message');
      expect(getErrorMessage(typeError)).toBe('Type error message');
    });

    it('should convert non-Error values to strings', () => {
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(123)).toBe('123');
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe('undefined');
    });

    it('should handle objects by converting to string', () => {
      const obj = { message: 'fake error' };
      expect(getErrorMessage(obj)).toBe('[object Object]');
    });
  });
});

describe('AirBnB-Style Error Handling', () => {
  it('should document the new error handling approach', () => {
    // This test serves as documentation for our new error handling approach
    // We now use AirBnB-style error handling where errors are returned as content
    // with isError: true rather than throwing custom error classes.

    // Example of the new pattern:
    const errorResponse = {
      content: [
        {
          type: 'text',
          text: 'Error: Invalid profile identifier format',
        },
      ],
      isError: true,
    };

    expect(errorResponse.isError).toBe(true);
    expect(errorResponse.content[0].type).toBe('text');
    expect(errorResponse.content[0].text).toContain('Error:');
  });

  it('should demonstrate standard Error usage in utilities', () => {
    // Our utility functions now throw standard Error objects
    // which are caught by the main handler and converted to error content

    const standardError = new Error('Standard error message');
    expect(standardError).toBeInstanceOf(Error);
    expect(standardError.message).toBe('Standard error message');

    // The main handler catches these and converts them to:
    // { content: [{ type: "text", text: "Error: Standard error message" }], isError: true }
  });
});
