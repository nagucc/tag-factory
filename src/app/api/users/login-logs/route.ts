import { NextRequest, NextResponse } from 'next/server';
import { LoginLog, User } from '@/lib/database/models';
import { WhereOptions } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const username = searchParams.get('username');
    const status = searchParams.get('status');
    const user_id = searchParams.get('user_id');

    const where: WhereOptions<LoginLog> = {};
    if (username) {
      where.username = { $like: `%${username}%` };
    }
    if (status) {
      where.status = parseInt(status);
    }
    if (user_id) {
      where.user_id = parseInt(user_id);
    }

    const { count, rows } = await LoginLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email'] },
      ],
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
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
    console.error('获取登录日志失败:', error);
    return NextResponse.json(
      { success: false, message: '获取登录日志失败' },
      { status: 500 }
    );
  }
}
