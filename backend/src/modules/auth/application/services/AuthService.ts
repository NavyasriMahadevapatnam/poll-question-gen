import { injectable, inject } from 'inversify';
import { BaseService } from '#core/base/BaseService.js';
import { ApiError } from '#core/errors/ApiError.js';
import { MongoDatabase } from '#infrastructure/database/mongodb/MongoDatabase.js';
import { GLOBAL_TYPES } from '#root/types.js';
import { AUTH_TYPES } from '../../types.js';
import { logger } from '#root/shared/utils/logger.js';
import { IAuthProvider } from '../../infrastructure/auth/IAuthProvider.js';
import { IUserRepository } from '#users/domain/repositories/IUserRepository.js';
import { User } from '#users/domain/entities/User.js';
import { Email } from '#users/domain/value-objects/Email.js';
import { UserRole } from '#users/domain/value-objects/UserRole.js';
import { Password } from '../../domain/value-objects/Password.js';
import { Token } from '../../domain/value-objects/Token.js';
import { SignupDto } from '../dtos/SignupDto.js';
import { ChangePasswordDto } from '../dtos/ChangePasswordDto.js';
import { AuthResponseDto } from '../dtos/AuthResponseDto.js';

@injectable()
export class AuthService extends BaseService {
  constructor(
    @inject(AUTH_TYPES.AuthProvider) private readonly authProvider: IAuthProvider,
    @inject(GLOBAL_TYPES.UserRepo) private readonly userRepo: IUserRepository,
    @inject(GLOBAL_TYPES.Database) private readonly database: MongoDatabase,
  ) {
    super(database);
  }

  async signup(data: SignupDto): Promise<AuthResponseDto> {
    try {
      const password = new Password(data.password);
      const email = new Email(data.email);

      const existingUser = await this.userRepo.findByEmail(data.email);
      if (existingUser) {
        throw ApiError.conflict('User with this email already exists');
      }

      const firebaseUser = await this.authProvider.createUser(
        data.email,
        password,
        `${data.firstName} ${data.lastName}`.trim(),
      );

      const user = new User({
        firebaseUID: firebaseUser.uid,
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: new UserRole('student'), // Default role
        isVerified: false,
      });

      // Save user to database within transaction
      let createdUser: User;
      await this._withTransaction(async (session) => {
        createdUser = await this.userRepo.create(user);

        if (!createdUser) {
          throw ApiError.internal('Failed to create user in database');
        }

        logger.info('User created successfully', {
          userId: createdUser.id,
          firebaseUID: firebaseUser.uid,
          email: data.email,
        });
      });

      return AuthResponseDto.success('User registered successfully', {
        userId: createdUser!.id,
        firebaseUID: firebaseUser.uid,
      });
    } catch (error) {
      logger.error('Signup failed', error instanceof Error ? error : new Error(String(error)), {
        email: data.email,
      });
      throw error;
    }
  }

  async verifyToken(tokenString: string): Promise<{ uid: string; email: string }> {
    try {
      const token = new Token(tokenString);
      const decoded = await this.authProvider.verifyToken(token);
      return decoded;
    } catch (error) {
      logger.error(
        'Token verification failed',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  async getCurrentUserFromToken(tokenString: string): Promise<User> {
    const decoded = await this.verifyToken(tokenString);

    const user = await this.userRepo.findByFirebaseUID(decoded.uid);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async getUserIdFromToken(tokenString: string): Promise<string> {
    const user = await this.getCurrentUserFromToken(tokenString);

    if (!user.id) {
      throw ApiError.internal('User ID not found');
    }

    return user.id;
  }

  async changePassword(data: ChangePasswordDto, firebaseUID: string): Promise<AuthResponseDto> {
    try {
      const newPassword = new Password(data.newPassword);
      const confirmPassword = new Password(data.newPasswordConfirm);

      Password.validateMatch(newPassword, confirmPassword);

      // Verify user exists
      const authUser = await this.authProvider.getUserByUID(firebaseUID);
      if (!authUser) {
        throw ApiError.notFound('User not found');
      }

      if (!authUser.isActive()) {
        throw ApiError.forbidden('User account is disabled');
      }

      // Update password in Firebase
      await this.authProvider.updatePassword(firebaseUID, newPassword);

      logger.info('Password changed successfully', { firebaseUID });

      return AuthResponseDto.success('Password updated successfully');
    } catch (error) {
      logger.error(
        'Password change failed',
        error instanceof Error ? error : new Error(String(error)),
        { firebaseUID },
      );
      throw error;
    }
  }
}
