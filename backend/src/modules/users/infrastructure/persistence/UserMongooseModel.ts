import mongoose, { Schema, Document } from 'mongoose';

/**
 * Mongoose Document Interface for User
 */
export interface IUserDocument extends Document {
  firebaseUID: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string | null;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  phoneNumber?: string | null;
  institution?: string | null;
  designation?: string | null;
  bio?: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose Schema for User
 */
const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUID: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    role: { type: String, default: 'student' },
    avatar: { type: String, default: null },
    dateOfBirth: { type: String, default: '' },
    address: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    phoneNumber: { type: String, default: null },
    institution: { type: String, default: null },
    designation: { type: String, default: null },
    bio: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

/**
 * User Mongoose Model
 */
export const UserMongooseModel =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ||
  mongoose.model<IUserDocument>('User', UserSchema);
