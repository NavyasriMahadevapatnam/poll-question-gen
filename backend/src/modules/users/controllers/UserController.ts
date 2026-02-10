import { User } from '#auth/classes/transformers/User.js';
import { UserService } from '#users/services/UserService.js';
import { USERS_TYPES } from '#users/types.js';
import { injectable, inject } from 'inversify';
import {
  JsonController,
  Get,
  Put,
  Post,
  Body,
  HttpCode,
  Param,
  Params,
  Patch,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import {
  UserByFirebaseUIDParams,
  UserByFirebaseUIDResponse,
  UserNotFoundErrorResponse,
  UpdateUserProfileBody,
  CreateUserProfileBody,
  UserProfileResponse,
} from '../classes/validators/UserValidators.js';
import { UserModel } from '#root/shared/database/models/User.js';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#core/errors/ApiError.js';

@OpenAPI({ tags: ['Users'] })
@JsonController('/users', { transformResponse: true })
@injectable()
export class UserController {
  constructor(
    @inject(USERS_TYPES.UserService)
    private readonly userService: UserService,
  ) {}

  /**
   * Get full user object by Firebase UID (transformed)
   */
  @OpenAPI({
    summary: 'Get user by Firebase UID',
    description: 'Retrieves a full user object using their Firebase UID.',
  })
  @Get('/firebase/:firebaseUID')
  @HttpCode(200)
  @ResponseSchema(UserByFirebaseUIDResponse)
  @ResponseSchema(UserNotFoundErrorResponse, { statusCode: 404 })
  async getUserByFirebaseUID(@Params() params: UserByFirebaseUIDParams): Promise<User> {
    logger.info('Fetching user by Firebase UID', { firebaseUID: params.firebaseUID });
    const user = await this.userService.findByFirebaseUID(params.firebaseUID);
    if (!user) {
      logger.warn('User not found', { firebaseUID: params.firebaseUID });
      throw ApiError.notFound('User not found');
    }
    return new User(user);
  }

  /**
   *  Find or create user by Firebase UID
   */
  @OpenAPI({
    summary: 'Find or create user by Firebase UID',
    description: 'If user does not exist with the given UID, creates one.',
  })
  @Post('/firebase/:firebaseUID/profile')
  @HttpCode(201)
  @ResponseSchema(UserProfileResponse)
  async findOrCreateProfileByFirebaseUID(
    @Param('firebaseUID') firebaseUID: string,
    @Body() body: CreateUserProfileBody,
  ) {
    logger.info('Finding or creating user profile', { firebaseUID, email: body.email });
    const user = await this.userService.findOrCreateByFirebaseUID(firebaseUID, body);
    return {
      id: user._id?.toString() || '',
      firebaseUID: user.firebaseUID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || null,
      dateOfBirth: user.dateOfBirth || null,
      address: user.address || null,
      emergencyContact: user.emergencyContact || null,
      phoneNumber: user.phoneNumber || null,
      institution: user.institution || null,
      designation: user.designation || null,
      bio: user.bio || null,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   *  Get user profile by internal ID
   */
  @OpenAPI({
    summary: 'Get user profile by internal user ID',
  })
  @Get('/:id/profile')
  @HttpCode(200)
  @ResponseSchema(UserProfileResponse)
  async getProfile(@Param('id') id: string) {
    logger.info('Fetching user profile', { userId: id });
    const user = await this.userService.getProfile(id);
    if (!user) {
      logger.warn('User profile not found', { userId: id });
      throw ApiError.notFound('User not found');
    }
    return user;
  }

  /**
   *  Update profile by internal ID
   */
  @OpenAPI({
    summary: 'Update user profile by internal user ID',
  })
  @Put('/:id/profile')
  @HttpCode(200)
  @ResponseSchema(UserProfileResponse)
  async updateProfile(@Param('id') id: string, @Body() body: UpdateUserProfileBody) {
    logger.info('Updating user profile', { userId: id });
    const updated = await this.userService.updateProfile(id, body);
    return updated;
  }

  /**
   *  Get simple profile by Firebase UID (raw JSON)
   */
  @OpenAPI({
    summary: 'Get user profile by Firebase UID (plain JSON)',
  })
  @Get('/firebase/:firebaseUID/profile')
  @HttpCode(200)
  @ResponseSchema(UserProfileResponse)
  async getProfileByFirebaseUID(@Param('firebaseUID') firebaseUID: string) {
    logger.info('Fetching profile by Firebase UID', { firebaseUID });
    const user = await this.userService.findByFirebaseUID(firebaseUID);
    if (!user) {
      logger.warn('User not found', { firebaseUID });
      throw ApiError.notFound('User not found');
    }
    return {
      id: user._id?.toString() || '',
      firebaseUID: user.firebaseUID,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar || null,
      role: user.role || null,
      dateOfBirth: user.dateOfBirth || null,
      address: user.address || null,
      emergencyContact: user.emergencyContact || null,
      phoneNumber: user.phoneNumber || null,
      institution: user.institution || null,
      designation: user.designation || null,
      bio: user.bio || null,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update a user's role by Firebase UID
   */
  @OpenAPI({
    summary: 'Update user role by Firebase UID',
    description: 'Updates the role of a user identified by Firebase UID.',
  })
  @Patch('/firebase/:firebaseUID/role')
  @HttpCode(200)
  async updateRole(@Param('firebaseUID') firebaseUID: string, @Body() body: { role: string }) {
    const { role } = body;
    if (!role || typeof role !== 'string') {
      logger.warn('Invalid role provided', { firebaseUID, role });
      throw ApiError.badRequest('Role must be a non-empty string');
    }

    logger.info('Updating user role', { firebaseUID, role });
    const updatedUser = await this.userService.updateRoleByFirebaseUID(firebaseUID, role);
    return {
      id: updatedUser._id?.toString() || '',
      firebaseUID: updatedUser.firebaseUID,
      role: updatedUser.role,
    };
  }
}
