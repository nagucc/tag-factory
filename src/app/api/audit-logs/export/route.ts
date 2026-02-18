import { NextRequest, NextResponse } from 'next/server';
import { AuditLog, User } from '@/lib/database/models';
import { Op } from 'sequelize';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const format = searchParams.get('format') || 'csv';

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

    const logs = await AuditLog.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'username'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 10000,
    });

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: logs.map(log => ({
          id: log.id,
          username: log.username,
          action: log.action,
          resource_type: log.resource_type,
          resource_id: log.resource_id,
          details: log.details,
          ip_address: log.ip_address,
          status: log.status,
          created_at: log.created_at,
        })),
      });
    }

    const headers = ['ID', '用户名', '操作', '资源类型', '资源ID', 'IP地址', '状态', '时间'];
    const csvRows: string[] = [headers.join(',')];

    logs.forEach(log => {
      const logData = log.toJSON();
      const row = [
        logData.id,
        logData.username || '',
        logData.action,
        logData.resource_type,
        logData.resource_id || '',
        logData.ip_address || '',
        logData.status === 1 ? '成功' : '失败',
        logData.created_at ? new Date(logData.created_at).toLocaleString('zh-CN') : '',
      ];
      csvRows.push(row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    const csvContent = '\ufeff' + csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('导出审计日志失败:', error);
    return NextResponse.json(
      { success: false, message: '导出审计日志失败' },
      { status: 500 }
    );
  }
}
