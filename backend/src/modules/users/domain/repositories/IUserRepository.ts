import { User } from '../entities/User.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;

  findByFirebaseUID(firebaseUID: string): Promise<User | null>;

  findByEmail(email: string): Promise<User | null>;

  create(user: User): Promise<User>;

  update(user: User): Promise<User | null>;

  delete(id: string): Promise<boolean>;

  /**
   * Find all users (with optional pagination)
   */
  findAll(skip?: number, limit?: number): Promise<User[]>;
}
