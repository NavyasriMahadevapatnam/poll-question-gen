import { ApiError } from '#core/errors/ApiError.js';

/**
 * User Role Value Object
 * Ensures only valid roles are used
 */
export enum UserRoleEnum {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  GUEST = 'guest',
}

export class UserRole {
  private readonly value: UserRoleEnum;

  constructor(role?: string | null) {
    // Default to STUDENT if no role provided or role is 'null' (legacy)
    if (!role || role === 'null') {
      this.value = UserRoleEnum.STUDENT;
    } else {
      this.validate(role);
      this.value = role as UserRoleEnum;
    }
  }

  private validate(role: string): void {
    if (!Object.values(UserRoleEnum).includes(role as UserRoleEnum)) {
      throw ApiError.badRequest(
        `Invalid role. Must be one of: ${Object.values(UserRoleEnum).join(', ')}`,
      );
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserRole): boolean {
    return this.value === other.value;
  }

  isAdmin(): boolean {
    return this.value === UserRoleEnum.ADMIN;
  }

  isTeacher(): boolean {
    return this.value === UserRoleEnum.TEACHER;
  }

  isStudent(): boolean {
    return this.value === UserRoleEnum.STUDENT;
  }

  isGuest(): boolean {
    return this.value === UserRoleEnum.GUEST;
  }
}
