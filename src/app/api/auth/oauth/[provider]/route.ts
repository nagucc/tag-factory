import { NextRequest, NextResponse } from 'next/server';
import { createOAuthProvider } from '@/lib/auth/oauth/adapter';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;

    if (!['github', 'google'].includes(provider)) {
      return NextResponse.json(
        { success: false, message: '不支持的OAuth提供商' },
        { status: 400 }
      );
    }

    const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
    const callbackUrl = process.env[`${provider.toUpperCase()}_CALLBACK_URL`] || `${request.nextUrl.origin}/api/auth/oauth/${provider}/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: `${provider} OAuth未配置` },
        { status: 400 }
      );
    }

    const state = Math.random().toString(36).substring(2);
    const oauthProvider = createOAuthProvider(provider as 'github' | 'google', clientId, clientSecret, callbackUrl);
    const authUrl = oauthProvider.getAuthorizationUrl(state);

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(`oauth_state_${provider}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('OAuth授权错误:', error);
    return NextResponse.json(
      { success: false, message: 'OAuth授权失败' },
      { status: 500 }
    );
  }
}
