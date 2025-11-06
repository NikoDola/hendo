import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/services/auth.service';

export type ApiHandler = (
  request: NextRequest,
  context?: Record<string, unknown>
) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    try {
      const user = await getUserFromSession();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      return handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function withAdmin(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    try {
      const user = await getUserFromSession();
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      if (user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: Admin access required' },
          { status: 403 }
        );
      }

      return handler(request, context);
    } catch (error) {
      console.error('Admin middleware error:', error);
      return NextResponse.json(
        { error: 'Authorization failed' },
        { status: 401 }
      );
    }
  };
}

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: Record<string, unknown>) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API error:', error);
      
      const message = error instanceof Error ? error.message : 'Internal server error';
      const status = (error as { statusCode?: number })?.statusCode || 500;

      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  };
}

export function composeMiddleware(...middlewares: Array<(handler: ApiHandler) => ApiHandler>) {
  return (handler: ApiHandler): ApiHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

