/**
 * DTO for authentication response
 */
export class AuthResponseDto {
  success!: boolean;
  message!: string;
  data?: any;

  static success(message: string, data?: any): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.success = true;
    dto.message = message;
    dto.data = data;
    return dto;
  }

  static failure(message: string): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.success = false;
    dto.message = message;
    return dto;
  }
}
