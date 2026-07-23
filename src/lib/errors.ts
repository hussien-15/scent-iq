import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AuthorizationError } from '@/lib/authorization';
import { RateLimitError } from '@/lib/security';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INVALID_ORIGIN'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} was not found.`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with the current state.') {
    super('CONFLICT', message, 409);
  }
}

function zodDetails(error: ZodError) {
  return error.flatten();
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof ZodError) return new ValidationError(undefined, zodDetails(error));
  if (error instanceof RateLimitError) {
    return new AppError('RATE_LIMITED', 'Too many requests. Please try again later.', 429, undefined, error.retryAfterSeconds);
  }
  if (error instanceof AuthorizationError) {
    const unauthenticated = error.message === 'Authentication required.';
    return new AppError(
      unauthenticated ? 'AUTHENTICATION_REQUIRED' : 'PERMISSION_DENIED',
      unauthenticated ? 'Authentication is required.' : 'You do not have permission to perform this action.',
      unauthenticated ? 401 : 403
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return new ConflictError('A record with the same unique value already exists.');
    if (error.code === 'P2025') return new NotFoundError();
  }
  if (error instanceof SyntaxError) return new ValidationError('The request body is not valid JSON.');
  if (error instanceof Error && /origin|cross-site/i.test(error.message)) {
    return new AppError('INVALID_ORIGIN', 'The request origin is not allowed.', 403);
  }
  return new AppError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);
}
