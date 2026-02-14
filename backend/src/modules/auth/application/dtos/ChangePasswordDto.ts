import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for changing password
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  newPasswordConfirm!: string;
}
