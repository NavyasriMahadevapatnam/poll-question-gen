import { injectable, inject } from 'inversify';
import { BaseService } from '#core/base/BaseService.js';
import { ApiError } from '#core/errors/ApiError.js';
import { MongoDatabase } from '#infrastructure/database/mongodb/MongoDatabase.js';
import { GLOBAL_TYPES } from '#root/types.js';
import { logger } from '#root/shared/utils/logger.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import { Email } from '../../domain/value-objects/Email.js';
import { UserRole } from '../../domain/value-objects/UserRole.js';
import { CreateUserDto } from '../dtos/CreateUserDto.js';
import { UpdateUserDto } from '../dtos/UpdateUserDto.js';
import { UserResponseDto } from '../dtos/UserResponseDto.js';

/**
 * User Application Service
 * Orchestrates business logic and coordinates between domain and infrastructure
 */
@injectable()
export class UserService extends BaseService {
  constructor(
    @inject(GLOBAL_TYPES.UserRepo) private readonly userRepo: IUserRepository,
    @inject(GLOBAL_TYPES.Database) private readonly database: MongoDatabase,
  ) {
    super(database);
  }

  /**
   * Find or create user by Firebase UID
   */
  async findOrCreateByFirebaseUID(
    firebaseUID: string,
    data: CreateUserDto,
  ): Promise<UserResponseDto> {
    try {
      // Try to find existing user
      let user = await this.userRepo.findByFirebaseUID(firebaseUID);

      if (!user) {
        // Create new user using domain entity
        const newUser = new User({
          firebaseUID,
          email: new Email(data.email),
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          role: new UserRole(data.role),
          avatar: data.avatar,
          phoneNumber: data.phoneNumber,
          institution: data.institution,
          designation: data.designation,
          bio: data.bio,
          isVerified: data.isVerified ?? false,
          dateOfBirth: data.dateOfBirth,
          address: data.address,
          emergencyContact: data.emergencyContact,
        });

        user = await this.userRepo.create(newUser);
        logger.info('Created new user', { userId: user.id, firebaseUID });
      }

      return UserResponseDto.fromDomain(user);
    } catch (error) {
      logger.error(
        'Error finding or creating user',
        error instanceof Error ? error : new Error(String(error)),
        { firebaseUID },
      );
      throw error;
    }
  }

  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUID(firebaseUID: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findByFirebaseUID(firebaseUID);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return UserResponseDto.fromDomain(user);
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return UserResponseDto.fromDomain(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Use domain method to update profile
    user.updateProfile(data);

    const updatedUser = await this.userRepo.update(user);
    if (!updatedUser) {
      throw ApiError.internal('Failed to update user');
    }

    logger.info('Updated user profile', { userId });
    return UserResponseDto.fromDomain(updatedUser);
  }

  /**
   * Update user avatar
   */
  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<{ success: boolean; message: string; avatar: string | null | undefined }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.updateProfile({ avatar: avatarUrl });

    const updatedUser = await this.userRepo.update(user);
    if (!updatedUser) {
      throw ApiError.internal('Failed to update avatar');
    }

    logger.info('Updated user avatar', { userId });
    return {
      success: true,
      message: 'Avatar updated successfully',
      avatar: updatedUser.avatar,
    };
  }

  /**
   * Update user role by Firebase UID
   */
  async updateRoleByFirebaseUID(firebaseUID: string, role: string): Promise<UserResponseDto> {
    if (!role || typeof role !== 'string') {
      logger.warn('Invalid role provided for update', { firebaseUID, role });
      throw ApiError.badRequest('Role must be a non-empty string');
    }

    const user = await this.userRepo.findByFirebaseUID(firebaseUID);
    if (!user) {
      logger.error('User not found for role update', undefined, { firebaseUID });
      throw ApiError.notFound('User not found');
    }

    // Use domain method to change role
    const newRole = new UserRole(role);
    user.changeRole(newRole);

    const updatedUser = await this.userRepo.update(user);
    if (!updatedUser) {
      throw ApiError.internal('Failed to update role');
    }

    logger.info('Updated user role', { firebaseUID, newRole: role });
    return UserResponseDto.fromDomain(updatedUser);
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UserResponseDto> {
    logger.debug('Finding user by email', { email });
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return UserResponseDto.fromDomain(user);
  }
}
