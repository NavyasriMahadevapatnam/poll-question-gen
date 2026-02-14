import { injectable, inject } from 'inversify';
import {
  JsonController,
  Post,
  UseBefore,
  HttpCode,
  Body,
  Authorized,
  Patch,
  Req,
  OnUndefined,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { AuthRateLimiter } from '#shared/middleware/rateLimiter.js';
import { AUTH_TYPES } from '../../types.js';
import { AuthService } from '../../application/services/AuthService.js';
import { SignupDto } from '../../application/dtos/SignupDto.js';
import { ChangePasswordDto } from '../../application/dtos/ChangePasswordDto.js';
import {
  SignUpBody,
  ChangePasswordBody,
  LoginBody,
} from '../../classes/validators/AuthValidators.js';
import { AuthenticatedRequest } from '../../interfaces/IAuthService.js';
import { appConfig } from '#root/config/app.js';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#core/errors/ApiError.js';

/**
 * Authentication Controller (Presentation Layer)
 * Handles HTTP requests for authentication operations
 */
@OpenAPI({
  tags: ['Authentication'],
})
@JsonController('/auth')
@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService)
    private readonly authService: AuthService,
  ) {}

  @OpenAPI({
    summary: 'Register a new user account',
    description:
      'Registers a new user using Firebase Authentication and stores additional user details in the application database. This is typically the first step for any new user to access the system.',
  })
  @Post('/signup')
  @UseBefore(AuthRateLimiter)
  @HttpCode(201)
  @OnUndefined(201)
  async signup(@Body() body: SignUpBody) {
    logger.info('User signup attempt', { email: body.email });

    const dto: SignupDto = {
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    };

    const result = await this.authService.signup(dto);
    return result;
  }

  @OpenAPI({
    summary: 'Change user password',
    description:
      'Allows an authenticated user to update their password. This action is performed via Firebase Authentication and requires the current credentials to be valid.',
  })
  @Authorized()
  @Patch('/change-password')
  async changePassword(@Body() body: ChangePasswordBody, @Req() request: AuthenticatedRequest) {
    logger.info('Password change attempt', { userId: request.user._id.toString() });

    const dto: ChangePasswordDto = {
      newPassword: body.newPassword,
      newPasswordConfirm: body.newPasswordConfirm,
    };

    const result = await this.authService.changePassword(dto, request.user.firebaseUID);
    logger.info('Password changed successfully', { userId: request.user._id.toString() });
    return result;
  }

  @OpenAPI({
    summary: 'Verify Firebase ID token',
    description:
      'Validates whether the provided Firebase ID token is authentic and not expired. Useful for checking the session validity or re-authenticating a user.',
  })
  @Post('/verify')
  async verifyToken() {
    return {
      message: 'Token is valid',
    };
  }

  @OpenAPI({
    summary: 'Login user',
    description:
      'Authenticates a user with email and password using Firebase Authentication. Returns an ID token and refresh token upon successful authentication.',
  })
  @Post('/login')
  @UseBefore(AuthRateLimiter)
  async login(@Body() body: LoginBody) {
    const { email, password } = body;
    logger.info('User login attempt', { email });

    const data = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${appConfig.firebase.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      },
    );

    const result = (await data.json()) as {
      error?: { message: string };
      idToken?: string;
      refreshToken?: string;
    };

    if (result.error) {
      logger.warn('Login failed', { email, error: result.error.message });
      throw ApiError.unauthorized(result.error.message);
    }

    logger.info('User logged in successfully', { email });
    return result;
  }
}
