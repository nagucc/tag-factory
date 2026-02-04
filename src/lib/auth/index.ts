import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User, Role, Permission } from '@/lib/database/models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000;

export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
}

export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    console.error('JWT验证错误:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function checkAccountLockout(user: any): Promise<{ locked: boolean; remainingTime?: number }> {
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingTime = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000 / 60);
    return { locked: true, remainingTime };
  }
  return { locked: false };
}

export async function incrementLoginAttempts(user: any): Promise<void> {
  const attempts = user.failed_login_attempts + 1;
  
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await user.update({
      failed_login_attempts: attempts,
      locked_until: new Date(Date.now() + LOCKOUT_DURATION),
    });
  } else {
    await user.update({
      failed_login_attempts: attempts,
    });
  }
}

export async function resetLoginAttempts(user: any): Promise<void> {
  await user.update({
    failed_login_attempts: 0,
    locked_until: undefined,
    last_login: new Date(),
  });
}

export async function getUserWithRole(userId: number): Promise<{ user: any; permissions: Permission[] } | null> {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: 'role',
        include: [
          {
            model: Permission,
            as: 'permissions',
          },
        ],
      },
    ],
  });

  if (!user) return null;

  const roleData = (user as any).role;
  const permissions = roleData?.permissions || [];
  return { user, permissions };
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
