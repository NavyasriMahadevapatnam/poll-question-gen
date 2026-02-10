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
import { User } from '#auth/classes/transformers/User.js';
import { USERS_TYPES } from '../../types.js';
import { UserService } from '../../application/services/UserService.js';
import { CreateUserDto } from '../../application/dtos/CreateUserDto.js';
import { UpdateUserDto } from '../../application/dtos/UpdateUserDto.js';
import {
  UserByFirebaseUIDParams,
  UserByFirebaseUIDResponse,
  UserNotFoundErrorResponse,
  UpdateUserProfileBody,
  CreateUserProfileBody,
  UserProfileResponse,
} from '../../classes/validators/UserValidators.js';
import { logger } from '#root/shared/utils/logger.js';
import { ApiError } from '#core/errors/ApiError.js';

/**
 * User Controller (Presentation Layer)
 * Handles HTTP requests and responses
 */
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
    const userDto = await this.userService.findByFirebaseUID(params.firebaseUID);
    // Convert DTO back to old User transformer format for backward compatibility
    return new User({
      _id: userDto.id,
      firebaseUID: userDto.firebaseUID,
      email: userDto.email,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      role: userDto.role,
      avatar: userDto.avatar,
      phoneNumber: userDto.phoneNumber,
      institution: userDto.institution,
      designation: userDto.designation,
      bio: userDto.bio,
      isVerified: userDto.isVerified,
      dateOfBirth: userDto.dateOfBirth,
      address: userDto.address,
      emergencyContact: userDto.emergencyContact,
      createdAt: userDto.createdAt,
      updatedAt: userDto.updatedAt,
    });
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

    const dto: CreateUserDto = {
      firebaseUID,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      avatar: body.avatar,
      phoneNumber: body.phoneNumber,
      institution: body.institution,
      designation: body.designation,
      bio: body.bio,
      isVerified: body.isVerified,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      emergencyContact: body.emergencyContact,
    };

    const user = await this.userService.findOrCreateByFirebaseUID(firebaseUID, dto);
    return user;
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

    const dto: UpdateUserDto = {
      firstName: body.firstName,
      lastName: body.lastName,
      avatar: body.avatar,
      phoneNumber: body.phoneNumber,
      institution: body.institution,
      designation: body.designation,
      bio: body.bio,
      dateOfBirth: body.dateOfBirth,
      address: body.address,
      emergencyContact: body.emergencyContact,
    };

    const updated = await this.userService.updateProfile(id, dto);
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
    return user;
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
      id: updatedUser.id,
      firebaseUID: updatedUser.firebaseUID,
      role: updatedUser.role,
    };
  }
}
