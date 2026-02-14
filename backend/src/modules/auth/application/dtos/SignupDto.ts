import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for user signup
 */
export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}
