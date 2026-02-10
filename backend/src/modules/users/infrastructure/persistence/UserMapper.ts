import { User } from '../../domain/entities/User.js';
import { Email } from '../../domain/value-objects/Email.js';
import { UserRole } from '../../domain/value-objects/UserRole.js';
import { IUserDocument } from './UserMongooseModel.js';

// User Mapper - Maps between Domain Entity and Persistence Model
export class UserMapper {
  static toDomain(doc: IUserDocument): User {
    return new User({
      id: doc._id.toString(),
      firebaseUID: doc.firebaseUID,
      email: new Email(doc.email),
      firstName: doc.firstName,
      lastName: doc.lastName,
      role: new UserRole(doc.role),
      avatar: doc.avatar,
      phoneNumber: doc.phoneNumber,
      institution: doc.institution,
      designation: doc.designation,
      bio: doc.bio,
      isVerified: doc.isVerified,
      dateOfBirth: doc.dateOfBirth,
      address: doc.address,
      emergencyContact: doc.emergencyContact,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  // Convert Domain Entity to Persistence Object (for saving)
  static toPersistence(user: User): Partial<IUserDocument> {
    return {
      firebaseUID: user.firebaseUID,
      email: user.email.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.toString(),
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      institution: user.institution,
      designation: user.designation,
      bio: user.bio,
      isVerified: user.isVerified,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      emergencyContact: user.emergencyContact,
    };
  }
}
