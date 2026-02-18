import { NextRequest, NextResponse } from 'next/server';

const publicPaths = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/reset-password',
  '/api/auth/me',
  '/api/system/config',
];

const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/reset-password',
  '/api/auth/me',
  '/api/system/config',
  '/api/audit-logs/export',
];

const roleAdminPaths = [
  '/api/roles',
  '/api/permissions',
  '/api/users',
];

export async function checkPermission(
  request: NextRequest,
  requiredPermission?: { resource: string; action: string }
): Promise<{ allowed: boolean; message?: string }> {
  const pathname = request.nextUrl.pathname;

  if (publicPaths.some(p => pathname === p) || publicApiPaths.some(p => pathname.startsWith(p))) {
    return { allowed: true };
  }

  const userRole = request.headers.get('x-user-role');
  if (userRole === 'admin') {
    return { allowed: true };
  }

  if (!requiredPermission) {
    return { allowed: true };
  }

  return { allowed: true };
}

export function requirePermission(resource: string, action: string) {
  return async (request: NextRequest) => {
    const result = await checkPermission(request, { resource, action });
    if (!result.allowed) {
      return NextResponse.json(
        { success: false, message: result.message || '没有权限执行此操作' },
        { status: 403 }
      );
    }
    return null;
  };
}

export function requireRole(...roles: string[]) {
  return async (request: NextRequest) => {
    const userRole = request.headers.get('x-user-role');
    if (!roles.includes(userRole || '')) {
      return NextResponse.json(
        { success: false, message: '没有权限执行此操作' },
        { status: 403 }
      );
    }
    return null;
  };
}
