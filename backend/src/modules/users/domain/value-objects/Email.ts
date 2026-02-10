import { ApiError } from '#core/errors/ApiError.js';

/**
 * Email Value Object
 * Ensures email addresses are always valid
 */
export class Email {
  private readonly value: string;

  constructor(email: string) {
    this.validate(email);
    this.value = email.toLowerCase().trim();
  }

  private validate(email: string): void {
    if (!email || email.trim() === '') {
      throw ApiError.badRequest('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw ApiError.badRequest('Invalid email format');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
