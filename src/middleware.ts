export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const apiPublicPaths = ['/api/auth/login', '/api/auth/reset-password', '/api/system/config'];

interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  exp?: number;
  iat?: number;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

function isAuthenticated(request: NextRequest): { authenticated: boolean; decoded: TokenPayload | null } {
  let token = request.cookies.get('auth_token')?.value;
  const authHeader = request.headers.get('authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) {
    return { authenticated: false, decoded: null };
  }

  const decoded = verifyToken(token);
  return { authenticated: !!decoded, decoded };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isApiPublicPath = apiPublicPaths.some(path => pathname.startsWith(path));

  if (pathname.startsWith('/api')) {
    if (isApiPublicPath) {
      return NextResponse.next();
    }
    
    const { authenticated, decoded } = isAuthenticated(request);
    
    if (!authenticated) {
      return NextResponse.json(
        { success: false, message: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded!.userId.toString());
    requestHeaders.set('x-username', decoded!.username);
    requestHeaders.set('x-user-role', decoded!.roleName);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const publicPagePaths = ['/', '/login'];
  const isPublicPage = publicPagePaths.includes(pathname);

  if (isPublicPage) {
    return NextResponse.next();
  }

  const { authenticated, decoded } = isAuthenticated(request);

  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded!.userId.toString());
  requestHeaders.set('x-username', decoded!.username);
  requestHeaders.set('x-user-role', decoded!.roleName);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
