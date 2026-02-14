import { ApiError } from '#core/errors/ApiError.js';

/**
 * Password Value Object
 * Ensures passwords meet security requirements
 */
export class Password {
  private readonly value: string;
  private static readonly MIN_LENGTH = 6;
  private static readonly MAX_LENGTH = 128;

  constructor(password: string) {
    this.validate(password);
    this.value = password;
  }

  private validate(password: string): void {
    if (!password || password.trim() === '') {
      throw ApiError.badRequest('Password cannot be empty');
    }

    if (password.length < Password.MIN_LENGTH) {
      throw ApiError.badRequest(`Password must be at least ${Password.MIN_LENGTH} characters long`);
    }

    if (password.length > Password.MAX_LENGTH) {
      throw ApiError.badRequest(`Password must not exceed ${Password.MAX_LENGTH} characters`);
    }

    // Additional password strength requirements can be added here
    // For example: require uppercase, lowercase, numbers, special characters
  }

  toString(): string {
    return this.value;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }

  /**
   * Validates that two passwords match
   */
  static validateMatch(password: Password, confirmPassword: Password): void {
    if (!password.equals(confirmPassword)) {
      throw ApiError.badRequest('Passwords do not match');
    }
  }
}
