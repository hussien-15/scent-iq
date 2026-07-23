import { NextResponse } from 'next/server';
import { toAppError } from '@/lib/errors';
import type { ApiFailure, ApiSuccess } from '@/types/api';

type ResponseOptions = {
  status?: number;
  headers?: HeadersInit;
  message?: string;
};

export function apiSuccess<T>(data: T, options: ResponseOptions = {}) {
  const body: ApiSuccess<T> = { success: true, data, ...(options.message ? { message: options.message } : {}) };
  return NextResponse.json(body, { status: options.status ?? 200, headers: options.headers });
}

export function apiError(error: unknown, headers?: HeadersInit) {
  const safe = toAppError(error);
  const responseHeaders = new Headers(headers);
  if (safe.retryAfterSeconds) responseHeaders.set('Retry-After', String(safe.retryAfterSeconds));
  const body: ApiFailure = {
    success: false,
    error: safe.message,
    code: safe.code,
    ...(safe.details === undefined ? {} : { details: safe.details }),
  };
  return NextResponse.json(body, { status: safe.status, headers: responseHeaders });
}

export async function handleApi<T>(handler: () => Promise<NextResponse<T>>) {
  try {
    return await handler();
  } catch (error) {
    console.error('[api]', error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error');
    return apiError(error);
  }
}
