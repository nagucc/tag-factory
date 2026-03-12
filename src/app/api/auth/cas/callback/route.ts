import { NextRequest, NextResponse } from 'next/server';
import { createCASProvider } from '@/lib/auth/cas/adapter';
import { User, Role } from '@/lib/database/models';
import { generateToken } from '@/lib/auth';
import { getCASConfig, getAppConfig } from '@/lib/config';

/**
 * CAS回调接口
 * 处理CAS服务器返回的票据，验证用户身份并登录
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticket = searchParams.get('ticket');

    if (!ticket) {
      return NextResponse.redirect(new URL('/login?error=cas_no_ticket', request.url));
    }

    // 从配置文件获取CAS配置
    const casConfig = getCASConfig();

    if (!casConfig.enabled || !casConfig.serverUrl) {
      return NextResponse.redirect(new URL('/login?error=cas_not_configured', request.url));
    }

    // 构建服务URL
    const serviceUrl = `${request.nextUrl.origin}/api/auth/cas/callback`;

    // 创建CAS Provider并验证票据
    const casProvider = createCASProvider({
      serverUrl: casConfig.serverUrl,
      serviceUrl,
      version: casConfig.version,
      strictSSL: casConfig.strictSSL,
      pathPrefix: casConfig.pathPrefix,
    });

    // 验证CAS票据
    const casUserInfo = await casProvider.validateTicket(ticket);

    // 查找或创建本地用户
    let user = await User.findOne({
      where: {
        auth_type: 'cas',
        auth_id: casUserInfo.id,
      },
    });

    if (!user) {
      // 检查是否已存在相同用户名的本地用户
      const existingUser = await User.findOne({
        where: { username: casUserInfo.username },
      });

      if (existingUser) {
        // 如果存在本地用户，可以选择绑定或报错
        // 这里选择自动绑定
        await existingUser.update({
          auth_type: 'cas',
          auth_id: casUserInfo.id,
        });
        user = existingUser;
      } else {
        // 创建新用户
        // 从配置文件获取默认角色ID
        const defaultRoleId = casConfig.defaultRoleId;

        user = await User.create({
          username: casUserInfo.username,
          email: casUserInfo.email || `${casUserInfo.username}@cas.local`,
          password: 'cas_' + Math.random().toString(36).substring(2), // 随机密码，CAS用户不使用本地密码
          role_id: defaultRoleId,
          status: 1,
          auth_type: 'cas',
          auth_id: casUserInfo.id,
          last_login: new Date(),
        });
      }
    } else {
      // 更新最后登录时间
      await user.update({ last_login: new Date() });
    }

    // 检查用户状态
    if (user.get('status') !== 1) {
      return NextResponse.redirect(new URL('/login?error=account_disabled', request.url));
    }

    // 获取用户角色信息
    const userData = user.toJSON();
    const role = await Role.findByPk(userData.role_id);

    // 生成JWT Token
    const tokenPayload = {
      userId: userData.id,
      username: userData.username,
      email: userData.email,
      roleId: userData.role_id,
      roleName: role?.get('name') as string || 'user',
    };
    const token = generateToken(tokenPayload);

    // 获取应用配置
    const appConfig = getAppConfig();

    // 构建响应，设置Cookie并重定向到首页
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // 设置认证Cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: appConfig.env === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/',
    });

    // 同时设置一个非httpOnly的cookie用于前端判断登录状态
    response.cookies.set('is_logged_in', 'true', {
      httpOnly: false,
      secure: appConfig.env === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('CAS回调错误:', error);
    return NextResponse.redirect(new URL('/login?error=cas_failed', request.url));
  }
}
