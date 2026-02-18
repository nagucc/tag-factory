import { NextRequest, NextResponse } from 'next/server';
import { createOAuthProvider } from '@/lib/auth/oauth/adapter';
import { generateToken } from '@/lib/auth';
import { User, Role } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=no_code', request.url));
    }

    const storedState = request.cookies.get(`oauth_state_${provider}`)?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
    }

    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    const callbackUrl = process.env[`${provider.toUpperCase()}_CALLBACK_URL`] || `${request.nextUrl.origin}/api/auth/oauth/${provider}/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/login?error=not_configured', request.url));
    }

    const oauthProvider = createOAuthProvider(provider as 'github' | 'google', clientId, clientSecret, callbackUrl);
    const tokenData = await oauthProvider.getAccessToken(code);
    const userInfo = await oauthProvider.getUserInfo(tokenData.access_token);

    let user = await User.findOne({ where: { email: userInfo.email } });
    
    if (!user) {
      const defaultRole = await Role.findOne({ where: { name: 'user' } });
      user = await User.create({
        username: userInfo.username,
        email: userInfo.email,
        password: 'oauth_' + Math.random().toString(36).substring(2),
        role_id: defaultRole?.id || 2,
        status: 1,
      });
    }

    const userData = user.toJSON() as any;
    const role = await Role.findByPk(userData.role_id);
    const roleData = role?.toJSON() as any;
    
    const tokenPayload = {
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      roleId: userData.role_id,
      roleName: roleData?.name || 'user',
    };

    const token = generateToken(tokenPayload);

    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.delete(`oauth_state_${provider}`);

    return response;
  } catch (error) {
    console.error('OAuth回调错误:', error);
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }
}
