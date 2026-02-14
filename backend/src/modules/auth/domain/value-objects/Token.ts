import { ApiError } from '#core/errors/ApiError.js';

/**
 * Token Value Object
 * Represents an authentication token
 */
export class Token {
  private readonly value: string;

  constructor(token: string) {
    this.validate(token);
    this.value = token.trim();
  }

  private validate(token: string): void {
    if (!token || token.trim() === '') {
      throw ApiError.unauthorized('Token cannot be empty');
    }

    // Basic token format validation
    // Firebase tokens typically start with 'eyJ'
    if (!token.trim().startsWith('eyJ')) {
      throw ApiError.unauthorized('Invalid token format');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: Token): boolean {
    return this.value === other.value;
  }

  /**
   * Extract token from Authorization header
   */
  static fromAuthorizationHeader(header?: string): Token {
    if (!header) {
      throw ApiError.unauthorized('No authorization header provided');
    }

    const parts = header.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Invalid authorization header format');
    }

    return new Token(parts[1]);
  }
}
