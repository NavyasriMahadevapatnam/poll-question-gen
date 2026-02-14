import { AuthUser } from '../../domain/entities/AuthUser.js';
import { Token } from '../../domain/value-objects/Token.js';
import { Password } from '../../domain/value-objects/Password.js';

export interface IAuthProvider {
  createUser(
    email: string,
    password: Password,
    displayName: string,
  ): Promise<{ uid: string; email: string }>;

  verifyToken(token: Token): Promise<{ uid: string; email: string }>;

  getUserByUID(firebaseUID: string): Promise<AuthUser | null>;

  updatePassword(firebaseUID: string, newPassword: Password): Promise<void>;

  deleteUser(firebaseUID: string): Promise<void>;
}
