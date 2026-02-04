import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/reset-password'];
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  const isApiPublicPath = apiPublicPaths.some(path => pathname.startsWith(path));

  if (isPublicPath && !pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (isApiPublicPath) {
    return NextResponse.next();
  }

  let token = request.cookies.get('auth_token')?.value;
  const authHeader = request.headers.get('authorization');
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  }

  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: '未提供认证令牌' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: '认证令牌无效或已过期' },
        { status: 401 }
      );
    }

    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', decoded.userId.toString());
  requestHeaders.set('x-username', decoded.username);
  requestHeaders.set('x-user-role', decoded.roleName);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
