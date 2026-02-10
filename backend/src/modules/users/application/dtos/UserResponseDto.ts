/**
 * DTO for user response
 */
export class UserResponseDto {
  id!: string;
  firebaseUID!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  fullName!: string;
  role!: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  institution?: string | null;
  designation?: string | null;
  bio?: string | null;
  isVerified!: boolean;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(user: any): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id || '';
    dto.firebaseUID = user.firebaseUID;
    dto.email = user.email.toString();
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.fullName = user.fullName;
    dto.role = user.role.toString();
    dto.avatar = user.avatar;
    dto.phoneNumber = user.phoneNumber;
    dto.institution = user.institution;
    dto.designation = user.designation;
    dto.bio = user.bio;
    dto.isVerified = user.isVerified;
    dto.dateOfBirth = user.dateOfBirth;
    dto.address = user.address;
    dto.emergencyContact = user.emergencyContact;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
