import { injectable } from 'inversify';
import admin from 'firebase-admin';
import { IAuthProvider } from './IAuthProvider.js';
import { AuthUser } from '../../domain/entities/AuthUser.js';
import { Token } from '../../domain/value-objects/Token.js';
import { Password } from '../../domain/value-objects/Password.js';
import { ApiError } from '#core/errors/ApiError.js';
import { appConfig } from '#root/config/app.js';
import { logger } from '#root/shared/utils/logger.js';

@injectable()
export class FirebaseAuthProvider implements IAuthProvider {
  private auth: admin.auth.Auth;

  constructor() {
    this.initializeFirebase();
    this.auth = admin.auth();
  }

  private initializeFirebase(): void {
    if (!admin.apps.length) {
      if (appConfig.isDevelopment) {
        admin.initializeApp({
          credential: admin.credential.cert({
            clientEmail: appConfig.firebase.clientEmail,
            privateKey: appConfig.firebase.privateKey.replace(/\\n/g, '\n'),
            projectId: appConfig.firebase.projectId,
          }),
        });
        logger.info('Firebase initialized with credentials');
      } else {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        logger.info('Firebase initialized with application default credentials');
      }
    }
  }

  async createUser(
    email: string,
    password: Password,
    displayName: string,
  ): Promise<{ uid: string; email: string }> {
    try {
      const userRecord = await this.auth.createUser({
        email,
        emailVerified: false,
        password: password.toString(),
        displayName,
        disabled: false,
      });

      logger.info('Firebase user created', { uid: userRecord.uid, email });

      return {
        uid: userRecord.uid,
        email: userRecord.email || email,
      };
    } catch (error) {
      logger.error(
        'Failed to create Firebase user',
        error instanceof Error ? error : new Error(String(error)),
        { email },
      );

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          throw ApiError.conflict('User with this email already exists');
        }
        throw ApiError.internal(`Failed to create user in Firebase: ${error.message}`);
      }
      throw ApiError.internal('Failed to create user in Firebase');
    }
  }

  async verifyToken(token: Token): Promise<{ uid: string; email: string }> {
    try {
      const decodedToken = await this.auth.verifyIdToken(token.toString());

      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
      };
    } catch (error) {
      logger.error(
        'Token verification failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }

  async getUserByUID(firebaseUID: string): Promise<AuthUser | null> {
    try {
      const userRecord = await this.auth.getUser(firebaseUID);

      if (!userRecord) {
        return null;
      }

      const names = this.parseDisplayName(userRecord.displayName);

      return new AuthUser({
        firebaseUID: userRecord.uid,
        email: userRecord.email || '',
        firstName: names.firstName,
        lastName: names.lastName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
      });
    } catch (error) {
      logger.error(
        'Failed to get Firebase user',
        error instanceof Error ? error : new Error(String(error)),
        { firebaseUID },
      );
      return null;
    }
  }

  async updatePassword(firebaseUID: string, newPassword: Password): Promise<void> {
    try {
      await this.auth.updateUser(firebaseUID, {
        password: newPassword.toString(),
      });

      logger.info('Password updated successfully', { firebaseUID });
    } catch (error) {
      logger.error(
        'Failed to update password',
        error instanceof Error ? error : new Error(String(error)),
        { firebaseUID },
      );
      throw ApiError.internal('Failed to update password');
    }
  }

  async deleteUser(firebaseUID: string): Promise<void> {
    try {
      await this.auth.deleteUser(firebaseUID);
      logger.info('Firebase user deleted', { firebaseUID });
    } catch (error) {
      logger.error(
        'Failed to delete Firebase user',
        error instanceof Error ? error : new Error(String(error)),
        { firebaseUID },
      );
      throw ApiError.internal('Failed to delete user');
    }
  }

  private parseDisplayName(displayName?: string): { firstName: string; lastName: string } {
    if (!displayName) {
      return { firstName: '', lastName: '' };
    }

    const parts = displayName.trim().split(' ');
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  }
}
