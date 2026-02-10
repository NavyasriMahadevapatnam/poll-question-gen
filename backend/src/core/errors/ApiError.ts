export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    // Maintains proper stack trace for where error was thrown (V8 only)
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common HTTP errors
  static badRequest(message: string, context?: Record<string, unknown>): ApiError {
    return new ApiError(400, message, true, context);
  }

  static unauthorized(message = 'Unauthorized', context?: Record<string, unknown>): ApiError {
    return new ApiError(401, message, true, context);
  }

  static forbidden(message = 'Forbidden', context?: Record<string, unknown>): ApiError {
    return new ApiError(403, message, true, context);
  }

  static notFound(message = 'Resource not found', context?: Record<string, unknown>): ApiError {
    return new ApiError(404, message, true, context);
  }

  static conflict(message: string, context?: Record<string, unknown>): ApiError {
    return new ApiError(409, message, true, context);
  }

  static tooManyRequests(
    message = 'Too many requests',
    context?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(429, message, true, context);
  }

  static internal(message = 'Internal server error', context?: Record<string, unknown>): ApiError {
    return new ApiError(500, message, false, context);
  }

  static serviceUnavailable(
    message = 'Service unavailable',
    context?: Record<string, unknown>,
  ): ApiError {
    return new ApiError(503, message, true, context);
  }

  toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: this.message,
      statusCode: this.statusCode,
      ...(this.context && { details: this.context }),
    };
  }
}
