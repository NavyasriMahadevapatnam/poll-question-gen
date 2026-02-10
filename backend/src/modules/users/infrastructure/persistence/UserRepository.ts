import { injectable } from 'inversify';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { User } from '../../domain/entities/User.js';
import { UserMongooseModel } from './UserMongooseModel.js';
import { UserMapper } from './UserMapper.js';
import { logger } from '#root/shared/utils/logger.js';

/**
 * User Repository Implementation (Infrastructure Layer)
 * Handles data persistence using Mongoose
 */
@injectable()
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const doc = await UserMongooseModel.findById(id).lean().exec();
      if (!doc) return null;
      return UserMapper.toDomain(doc as any);
    } catch (error) {
      logger.error(
        'Error finding user by ID',
        error instanceof Error ? error : new Error(String(error)),
        { id },
      );
      throw error;
    }
  }

  async findByFirebaseUID(firebaseUID: string): Promise<User | null> {
    try {
      const doc = await UserMongooseModel.findOne({ firebaseUID }).lean().exec();
      if (!doc) return null;
      return UserMapper.toDomain(doc as any);
    } catch (error) {
      logger.error(
        'Error finding user by Firebase UID',
        error instanceof Error ? error : new Error(String(error)),
        { firebaseUID },
      );
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const doc = await UserMongooseModel.findOne({
        email: email.toLowerCase().trim(),
      })
        .lean()
        .exec();
      if (!doc) return null;
      return UserMapper.toDomain(doc as any);
    } catch (error) {
      logger.error(
        'Error finding user by email',
        error instanceof Error ? error : new Error(String(error)),
        { email },
      );
      throw error;
    }
  }

  async create(user: User): Promise<User> {
    try {
      const persistenceData = UserMapper.toPersistence(user);
      const doc = await UserMongooseModel.create(persistenceData);
      return UserMapper.toDomain(doc as any);
    } catch (error) {
      logger.error(
        'Error creating user',
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  async update(user: User): Promise<User | null> {
    try {
      if (!user.id) {
        throw new Error('Cannot update user without ID');
      }

      const persistenceData = UserMapper.toPersistence(user);
      const doc = await UserMongooseModel.findByIdAndUpdate(
        user.id,
        { ...persistenceData, updatedAt: new Date() },
        { new: true },
      )
        .lean()
        .exec();

      if (!doc) return null;
      return UserMapper.toDomain(doc as any);
    } catch (error) {
      logger.error(
        'Error updating user',
        error instanceof Error ? error : new Error(String(error)),
        { userId: user.id },
      );
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await UserMongooseModel.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      logger.error(
        'Error deleting user',
        error instanceof Error ? error : new Error(String(error)),
        { id },
      );
      throw error;
    }
  }

  async findAll(skip: number = 0, limit: number = 100): Promise<User[]> {
    try {
      const docs = await UserMongooseModel.find().skip(skip).limit(limit).lean().exec();
      return docs.map((doc) => UserMapper.toDomain(doc as any));
    } catch (error) {
      logger.error(
        'Error finding all users',
        error instanceof Error ? error : new Error(String(error)),
        { skip, limit },
      );
      throw error;
    }
  }
}
