import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString()
  firebaseUID!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  avatar?: string | null;

  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @IsString()
  @IsOptional()
  institution?: string | null;

  @IsString()
  @IsOptional()
  designation?: string | null;

  @IsString()
  @IsOptional()
  bio?: string | null;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;
}
