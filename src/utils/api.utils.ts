import { NextResponse } from 'next/server';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function validateRequired(data: Record<string, unknown>, fields: string[]): void {
  const missing = fields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new ApiError(
      `Missing required fields: ${missing.join(', ')}`,
      400
    );
  }
}

export function parseJson<T = unknown>(text: string): T {
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError('Invalid JSON format', 400);
  }
}

export async function parseRequestBody<T = unknown>(request: Request): Promise<T> {
  try {
    const text = await request.text();
    if (!text || text.trim().length === 0) {
      throw new ApiError('Request body is empty', 400);
    }
    return parseJson<T>(text);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('Failed to parse request body', 400);
  }
}

