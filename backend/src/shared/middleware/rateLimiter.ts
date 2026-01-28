import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// General rate limiter for API endpoints
export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true, // Use `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' },
  skipSuccessfulRequests: false,
});

// Authentication rate limiter - stricter limits
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Max 5 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
  skipSuccessfulRequests: false,
});

// AI/LLM rate limiter - protect Ollama resources
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  limit: 10, // Max 10 AI requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI requests. Please wait before making more requests.',
    retryAfter: 'Check Retry-After header for wait time',
  },
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false,
});

// Strict AI rate limiter for heavy operations (video processing, bulk generation)
export const strictAiRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minute window
  limit: 5, // Max 5 heavy AI requests per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded for resource-intensive AI operations. Please try again later.',
    retryAfter: 'Check Retry-After header for wait time',
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Per-user AI rate limiter (based on Firebase UID)
export const userAiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 20, // Max 20 requests per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.uid || (req as any).userId;
    return userId || req.ip || 'unknown';
  },
  message: {
    error: 'You have exceeded the AI request limit. Please wait before trying again.',
    retryAfter: 'Check Retry-After header for wait time',
  },
  skipSuccessfulRequests: false,
});

export const AuthRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    return authRateLimiter(req, res, next);
  } else {
    next();
  }
};

export const AiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }
  return aiRateLimiter(req, res, next);
};

export const StrictAiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }
  return strictAiRateLimiter(req, res, next);
};

export const UserAiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
    return next();
  }
  return userAiRateLimiter(req, res, next);
};
