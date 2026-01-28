# Backend Rate Limiting Strategy

## Overview

This backend implements comprehensive rate limiting to protect resources, especially for AI/LLM endpoints connected via Tailscale to Ollama.

## Rate Limiter Types

### 1. General API Rate Limiter

**Location:** `src/shared/middleware/rateLimiter.ts`

```typescript
export const rateLimiter;
```

- **Window:** 1 minute
- **Limit:** 100 requests per IP
- **Purpose:** General API protection
- **Applied to:** Standard API endpoints

### 2. Authentication Rate Limiter

```typescript
export const authRateLimiter;
export function AuthRateLimiter();
```

- **Window:** 15 minutes
- **Limit:** 5 requests per IP
- **Purpose:** Prevent brute force attacks
- **Applied to:** Login, registration, password reset endpoints
- **Environment:** Production only

### 3. AI Rate Limiter

```typescript
export const aiRateLimiter;
export function AiRateLimiter();
```

- **Window:** 1 minute
- **Limit:** 10 requests per IP
- **Purpose:** Protect Ollama LLM resources from abuse
- **Applied to:**
  - `/genai/generate/transcript/segment`
  - `/genai/generate/questions`
  - `/livequizzes/rooms/:code/generate-questions`
- **Can be disabled:** Set `DISABLE_RATE_LIMIT=true` in development

### 4. Strict AI Rate Limiter

```typescript
export const strictAiRateLimiter;
export function StrictAiRateLimiter();
```

- **Window:** 5 minutes
- **Limit:** 5 requests per IP
- **Purpose:** Protect against heavy resource-intensive operations
- **Applied to:**
  - `/genai/generate/transcript` (video processing + transcription)
  - `/genai/generate-course-items-from-video` (full course generation)
- **Can be disabled:** Set `DISABLE_RATE_LIMIT=true` in development

### 5. User-Based AI Rate Limiter

```typescript
export const userAiRateLimiter;
export function UserAiRateLimiter();
```

- **Window:** 1 minute
- **Limit:** 20 requests per authenticated user
- **Purpose:** More generous limits for authenticated users
- **Key:** Firebase UID (falls back to IP if not authenticated)
- **Applied to:** All `/genai/*` endpoints as secondary protection

## Protected Endpoints

### GenAI Module (`/genai/*`)

| Endpoint                                 | Rate Limiters | Justification                                              |
| ---------------------------------------- | ------------- | ---------------------------------------------------------- |
| `POST /generate/transcript`              | Strict + User | Video download, processing, transcription - most expensive |
| `POST /generate/transcript/segment`      | AI + User     | LLM-based segmentation - moderately expensive              |
| `POST /generate/questions`               | AI + User     | LLM question generation - moderately expensive             |
| `POST /generate-course-items-from-video` | Strict + User | Full pipeline - very expensive                             |

### LiveQuizzes Module (`/livequizzes/rooms/*`)

| Endpoint                         | Rate Limiters | Justification                                                  |
| -------------------------------- | ------------- | -------------------------------------------------------------- |
| `POST /:code/generate-questions` | AI + User     | LLM question generation from transcript - moderately expensive |

## Rate Limit Headers

All rate-limited responses include these headers:

```
RateLimit-Limit: Maximum requests allowed
RateLimit-Remaining: Remaining requests in window
RateLimit-Reset: Time when the window resets (Unix timestamp)
Retry-After: Seconds to wait before retry (on 429 responses)
```

## Error Response Format

When rate limit is exceeded (HTTP 429):

```json
{
  "error": "Too many AI requests. Please wait before making more requests.",
  "retryAfter": "Check Retry-After header for wait time"
}
```

## Configuration

### Environment Variables

```env
# Disable rate limiting in development (not recommended)
DISABLE_RATE_LIMIT=true

# Node environment
NODE_ENV=development|production
```

### Customizing Limits

Edit `src/shared/middleware/rateLimiter.ts`:

```typescript
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // Change window size
  limit: 10, // Change request limit
  // ... other options
});
```

## Monitoring

### Sentry Integration

Rate limit violations (429 responses) are automatically captured by Sentry for monitoring and alerting.

### Metrics to Track

- Number of 429 responses per endpoint
- Average requests per user per minute
- Peak usage times
- Most frequently hit rate limits

## Security Considerations

1. **IP-based limits** can be bypassed by VPNs/proxies
   - That's why we also implement user-based limits
2. **Headers can be spoofed** in requests
   - Server validates user tokens independently
3. **Distributed attacks** require additional protection
   - Consider implementing Redis-based distributed rate limiting for scaling

## References

- [express-rate-limit documentation](https://github.com/express-rate-limit/express-rate-limit)
- [OWASP Rate Limiting Guidelines](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- [Ollama Best Practices](https://github.com/ollama/ollama/blob/main/docs/api.md)
