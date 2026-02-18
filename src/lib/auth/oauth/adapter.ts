export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}

export interface OAuthUserInfo {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface OAuthProvider {
  name: string;
  config: OAuthConfig;
  getAuthorizationUrl(state: string): string;
  getAccessToken(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }>;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}

export class GitHubOAuthProvider implements OAuthProvider {
  name = 'github';
  config: OAuthConfig;

  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    this.config = {
      clientId,
      clientSecret,
      callbackUrl,
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scope: 'read:user user:email',
    };
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: this.config.scope,
      state,
    });
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    let email = data.email;
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (emailsResponse.ok) {
        const emails = await emailsResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        email = primaryEmail?.email;
      }
    }

    return {
      id: data.id.toString(),
      username: data.login,
      email: email || '',
      name: data.name || data.login,
      avatar: data.avatar_url,
    };
  }
}

export class GoogleOAuthProvider implements OAuthProvider {
  name = 'google';
  config: OAuthConfig;

  constructor(clientId: string, clientSecret: string, callbackUrl: string) {
    this.config = {
      clientId,
      clientSecret,
      callbackUrl,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: 'openid email profile',
    };
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.callbackUrl,
      scope: this.config.scope,
      state,
      response_type: 'code',
      access_type: 'offline',
    });
    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.config.callbackUrl,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    return {
      id: data.id,
      username: data.email.split('@')[0],
      email: data.email,
      name: data.name,
      avatar: data.picture,
    };
  }
}

export function createOAuthProvider(type: 'github' | 'google', clientId: string, clientSecret: string, callbackUrl: string): OAuthProvider {
  switch (type) {
    case 'github':
      return new GitHubOAuthProvider(clientId, clientSecret, callbackUrl);
    case 'google':
      return new GoogleOAuthProvider(clientId, clientSecret, callbackUrl);
    default:
      throw new Error(`Unsupported OAuth provider: ${type}`);
  }
}
