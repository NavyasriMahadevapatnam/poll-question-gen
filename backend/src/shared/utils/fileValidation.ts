import { Request } from 'express';
import { ApiError } from '../classes/ApiError.js';

export const FILE_UPLOAD_CONFIG = {
  // Maximum file size: 100MB
  MAX_FILE_SIZE: 100 * 1024 * 1024,

  // Allowed video MIME types
  ALLOWED_VIDEO_TYPES: [
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
  ],

  // Allowed audio MIME types
  ALLOWED_AUDIO_TYPES: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/x-m4a',
  ],

  // Allowed file extensions
  ALLOWED_VIDEO_EXTENSIONS: ['.mp4', '.mpeg', '.webm', '.mov', '.avi'],
  ALLOWED_AUDIO_EXTENSIONS: ['.mp3', '.wav', '.ogg', '.m4a'],
};

/**
 * Validates uploaded file for security
 * @param file - Multer file object
 * @param allowedTypes - Array of allowed MIME types
 * @param allowedExtensions - Array of allowed file extensions
 * @param maxSize - Maximum file size in bytes
 * @throws ApiError if validation fails
 */
export function validateFileUpload(
  file: Express.Multer.File | undefined,
  allowedTypes: string[],
  allowedExtensions: string[],
  maxSize: number = FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
): void {
  if (!file) {
    throw ApiError.badRequest('No file uploaded');
  }

  if (file.size > maxSize) {
    throw ApiError.badRequest(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw ApiError.badRequest(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw ApiError.badRequest(
      `Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`,
    );
  }

  if (file.originalname.includes('\0')) {
    throw ApiError.badRequest('Invalid filename');
  }

  if (
    file.originalname.includes('..') ||
    file.originalname.includes('/') ||
    file.originalname.includes('\\')
  ) {
    throw ApiError.badRequest('Invalid filename');
  }
}

export function validateVideoUpload(file: Express.Multer.File | undefined): void {
  validateFileUpload(
    file,
    FILE_UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES,
    FILE_UPLOAD_CONFIG.ALLOWED_VIDEO_EXTENSIONS,
    FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
  );
}

export function validateAudioUpload(file: Express.Multer.File | undefined): void {
  validateFileUpload(
    file,
    FILE_UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES,
    FILE_UPLOAD_CONFIG.ALLOWED_AUDIO_EXTENSIONS,
    FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
  );
}

export function validateMediaUpload(file: Express.Multer.File | undefined): void {
  validateFileUpload(
    file,
    [...FILE_UPLOAD_CONFIG.ALLOWED_VIDEO_TYPES, ...FILE_UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES],
    [
      ...FILE_UPLOAD_CONFIG.ALLOWED_VIDEO_EXTENSIONS,
      ...FILE_UPLOAD_CONFIG.ALLOWED_AUDIO_EXTENSIONS,
    ],
    FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
  );
}
