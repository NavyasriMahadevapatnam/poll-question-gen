export interface AuthUserProps {
  firebaseUID: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified?: boolean;
  disabled?: boolean;
}

export class AuthUser {
  private readonly _firebaseUID: string;
  private readonly _email: string;
  private readonly _firstName: string;
  private readonly _lastName: string;
  private _emailVerified: boolean;
  private _disabled: boolean;

  constructor(props: AuthUserProps) {
    this._firebaseUID = props.firebaseUID;
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._emailVerified = props.emailVerified ?? false;
    this._disabled = props.disabled ?? false;
  }

  // Getters
  get firebaseUID(): string {
    return this._firebaseUID;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get displayName(): string {
    return `${this._firstName} ${this._lastName}`.trim();
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get disabled(): boolean {
    return this._disabled;
  }

  // Business methods
  verifyEmail(): void {
    this._emailVerified = true;
  }

  disable(): void {
    this._disabled = true;
  }

  enable(): void {
    this._disabled = false;
  }

  isActive(): boolean {
    return !this._disabled;
  }
}
