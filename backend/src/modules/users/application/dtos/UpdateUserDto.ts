import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for updating user profile
 */
export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

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
