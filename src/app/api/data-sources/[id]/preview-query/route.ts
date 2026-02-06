import { NextRequest, NextResponse } from 'next/server';
import { DataSource } from '@/lib/database/models';
import syncService from '@/lib/sync/dataSync';
import { Model } from 'sequelize';

interface DataSourceAttributes {
  id: number;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  status: number;
  description?: string;
  last_connection?: Date;
  options?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

interface PreviewQueryBody {
  query_statement: string;
}

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    const body: PreviewQueryBody = await request.json();
    const { query_statement } = body;

    if (!query_statement) {
      return NextResponse.json(
        { success: false, message: '查询语句不能为空' },
        { status: 400 }
      );
    }

    const dataSource = await DataSource.findByPk(numericId);
    if (!dataSource) {
      return NextResponse.json(
        { success: false, message: '数据源不存在' },
        { status: 404 }
      );
    }

    const dsAttributes = dataSource.toJSON() as DataSourceAttributes;

    const result = await syncService.previewQuery(
      dsAttributes,
      query_statement,
      10
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: '查询预览成功',
    });
  } catch (error) {
    console.error('预览查询失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: `预览查询失败: ${error instanceof Error ? error.message : '未知错误'}`,
      },
      { status: 500 }
    );
  }
}
