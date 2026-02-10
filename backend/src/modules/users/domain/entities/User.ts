import { Email } from '../value-objects/Email.js';
import { UserRole } from '../value-objects/UserRole.js';
import { ApiError } from '#core/errors/ApiError.js';

export interface UserProps {
  id?: string;
  firebaseUID: string;
  email: Email;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string | null;
  phoneNumber?: string | null;
  institution?: string | null;
  designation?: string | null;
  bio?: string | null;
  isVerified?: boolean;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User Domain Entity
 * Contains business logic and rules for User
 */
export class User {
  private readonly _id?: string;
  private _firebaseUID: string;
  private _email: Email;
  private _firstName: string;
  private _lastName: string;
  private _role: UserRole;
  private _avatar?: string | null;
  private _phoneNumber?: string | null;
  private _institution?: string | null;
  private _designation?: string | null;
  private _bio?: string | null;
  private _isVerified: boolean;
  private _dateOfBirth?: string;
  private _address?: string;
  private _emergencyContact?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._firebaseUID = props.firebaseUID;
    this._email = props.email;
    this._firstName = props.firstName || '';
    this._lastName = props.lastName || '';
    this._role = props.role;
    this._avatar = props.avatar;
    this._phoneNumber = props.phoneNumber;
    this._institution = props.institution;
    this._designation = props.designation;
    this._bio = props.bio;
    this._isVerified = props.isVerified ?? false;
    this._dateOfBirth = props.dateOfBirth;
    this._address = props.address;
    this._emergencyContact = props.emergencyContact;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this._firebaseUID || this._firebaseUID.trim() === '') {
      throw ApiError.badRequest('Firebase UID is required');
    }
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get firebaseUID(): string {
    return this._firebaseUID;
  }

  get email(): Email {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get fullName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get role(): UserRole {
    return this._role;
  }

  get avatar(): string | null | undefined {
    return this._avatar;
  }

  get phoneNumber(): string | null | undefined {
    return this._phoneNumber;
  }

  get institution(): string | null | undefined {
    return this._institution;
  }

  get designation(): string | null | undefined {
    return this._designation;
  }

  get bio(): string | null | undefined {
    return this._bio;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get dateOfBirth(): string | undefined {
    return this._dateOfBirth;
  }

  get address(): string | undefined {
    return this._address;
  }

  get emergencyContact(): string | undefined {
    return this._emergencyContact;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  updateProfile(data: {
    firstName?: string;
    lastName?: string;
    avatar?: string | null;
    phoneNumber?: string | null;
    institution?: string | null;
    designation?: string | null;
    bio?: string | null;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
  }): void {
    if (data.firstName !== undefined) {
      this._firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      this._lastName = data.lastName;
    }
    if (data.avatar !== undefined) {
      this._avatar = data.avatar;
    }
    if (data.phoneNumber !== undefined) {
      this._phoneNumber = data.phoneNumber;
    }
    if (data.institution !== undefined) {
      this._institution = data.institution;
    }
    if (data.designation !== undefined) {
      this._designation = data.designation;
    }
    if (data.bio !== undefined) {
      this._bio = data.bio;
    }
    if (data.dateOfBirth !== undefined) {
      this._dateOfBirth = data.dateOfBirth;
    }
    if (data.address !== undefined) {
      this._address = data.address;
    }
    if (data.emergencyContact !== undefined) {
      this._emergencyContact = data.emergencyContact;
    }
    this._updatedAt = new Date();
  }

  verify(): void {
    this._isVerified = true;
    this._updatedAt = new Date();
  }

  changeRole(newRole: UserRole): void {
    this._role = newRole;
    this._updatedAt = new Date();
  }

  hasCompleteProfile(): boolean {
    return !!(
      this._firstName &&
      this._lastName &&
      this._email &&
      (this._phoneNumber || this._institution)
    );
  }
}
