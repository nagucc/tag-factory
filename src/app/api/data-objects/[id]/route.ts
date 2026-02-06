import { NextRequest, NextResponse } from 'next/server';
import { DataObject, DataSource, DataRecord } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    const dataObjectRaw = await DataObject.findByPk(numericId);
    if (!dataObjectRaw) {
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 404 }
      );
    }

    const dataObject = dataObjectRaw.get({ plain: true }) as {
      id: number;
      name: string;
      description?: string;
      data_source_id: number;
      query_statement: string;
      primary_key: string;
      display_template: string;
      sync_enabled: boolean;
      sync_cron?: string;
      sync_strategy: string;
      last_sync_at?: Date;
      last_sync_status?: string;
      sync_count: number;
      status: string;
      created_by: number;
      created_at: Date;
      updated_at: Date;
    };

    const dataSourceRaw = await DataSource.findByPk(dataObject.data_source_id, {
      attributes: ['id', 'name', 'type', 'host', 'port', 'database'],
    });

    const dataSource = dataSourceRaw?.get({ plain: true }) as {
      id: number;
      name: string;
      type: string;
      host: string;
      port: number;
      database: string;
    } | undefined;

    const recordCount = await DataRecord.count({
      where: { data_object_id: numericId, _sync_status: 'active' },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...dataObject,
        data_source: dataSource,
        record_count: recordCount,
      },
    });
  } catch (error) {
    console.error('获取数据对象详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据对象详情失败' },
      { status: 500 }
    );
  }
}

interface UpdateDataObjectBody {
  name?: string;
  description?: string;
  query_statement?: string;
  primary_key?: string;
  display_template?: string;
  sync_enabled?: boolean;
  sync_cron?: string;
  sync_strategy?: string;
  status?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    const body: UpdateDataObjectBody = await request.json();

    const dataObjectRaw = await DataObject.findByPk(numericId) as any;
    if (!dataObjectRaw) {
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 404 }
      );
    }

    if (body.name !== undefined) dataObjectRaw.name = body.name;
    if (body.description !== undefined) dataObjectRaw.description = body.description;
    if (body.query_statement !== undefined) dataObjectRaw.query_statement = body.query_statement;
    if (body.primary_key !== undefined) dataObjectRaw.primary_key = body.primary_key;
    if (body.display_template !== undefined) dataObjectRaw.display_template = body.display_template;
    if (body.sync_enabled !== undefined) dataObjectRaw.sync_enabled = body.sync_enabled;
    if (body.sync_cron !== undefined) dataObjectRaw.sync_cron = body.sync_cron;
    if (body.sync_strategy !== undefined) dataObjectRaw.sync_strategy = body.sync_strategy;
    if (body.status !== undefined) dataObjectRaw.status = body.status;

    await dataObjectRaw.save();

    return NextResponse.json({
      success: true,
      message: '数据对象更新成功',
      data: dataObjectRaw.get({ plain: true }),
    });
  } catch (error) {
    console.error('更新数据对象失败:', error);
    return NextResponse.json(
      { success: false, message: '更新数据对象失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    const dataObject = await DataObject.findByPk(numericId);
    if (!dataObject) {
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 404 }
      );
    }

    await DataRecord.destroy({ where: { data_object_id: numericId } });
    await dataObject.destroy();

    return NextResponse.json({
      success: true,
      message: '数据对象删除成功',
    });
  } catch (error) {
    console.error('删除数据对象失败:', error);
    return NextResponse.json(
      { success: false, message: '删除数据对象失败' },
      { status: 500 }
    );
  }
}
