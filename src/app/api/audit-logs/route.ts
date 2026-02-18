import { NextRequest, NextResponse } from 'next/server';
import { AuditLog, User } from '@/lib/database/models';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    const where: any = {};

    if (userId) {
      where.user_id = parseInt(userId);
    }
    if (action) {
      where.action = action;
    }
    if (resourceType) {
      where.resource_type = resourceType;
    }
    if (status) {
      where.status = parseInt(status);
    }
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.created_at[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] }
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    return NextResponse.json(
      { success: false, message: '获取审计日志失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      username,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
      status = 1,
    } = body;

    const auditLog = await AuditLog.create({
      user_id,
      username,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent,
      status,
    });

    return NextResponse.json({
      success: true,
      data: auditLog,
      message: '审计日志创建成功',
    });
  } catch (error) {
    console.error('创建审计日志失败:', error);
    return NextResponse.json(
      { success: false, message: '创建审计日志失败' },
      { status: 500 }
    );
  }
}
