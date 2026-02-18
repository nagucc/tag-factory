import { AuditLog } from '@/lib/database/models';
import { NextRequest } from 'next/server';

export interface AuditLogParams {
  user_id?: number;
  username?: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  status?: number;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await AuditLog.create({
      user_id: params.user_id,
      username: params.username,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      details: params.details,
      ip_address: params.ip_address,
      user_agent: params.user_agent,
      status: params.status ?? 1,
    });
  } catch (error) {
    console.error('创建审计日志失败:', error);
  }
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}
