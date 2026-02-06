import { NextRequest, NextResponse } from 'next/server';
import { DataObject, DataSource } from '@/lib/database/models';
import { WhereOptions, IncludeOptions, FindAndCountOptions } from 'sequelize';

interface DataObjectAttributes {
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
  created_at: Date;
  updated_at: Date;
}

interface DataSourceAttributes {
  id: number;
  name: string;
  type: string;
}

interface DataObjectInstance {
  id: number;
  name: string;
  description?: string;
  data_source_id: number;
  dataSource?: DataSourceAttributes;
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
  created_at: Date;
  updated_at: Date;
  toJSON(): DataObjectAttributes;
}

interface DataObjectListItem {
  id: number;
  name: string;
  description?: string;
  data_source_id: number;
  data_source_name?: string;
  data_source_type?: string;
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
  created_at: Date;
  updated_at: Date;
}

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const name = searchParams.get('name');
    const dataSourceId = searchParams.get('dataSourceId');
    const status = searchParams.get('status');

    const where: WhereOptions<DataObjectAttributes> = {};
    if (name) {
      where.name = { [Symbol.for('sequelize.op')]: 'LIKE', value: `%${name}%` };
    }
    if (dataSourceId) {
      where.data_source_id = parseInt(dataSourceId);
    }
    if (status) {
      where.status = status;
    }

    const include: IncludeOptions[] = [
      {
        model: DataSource,
        as: 'dataSource',
        attributes: ['id', 'name', 'type'],
      },
    ];

    const options: FindAndCountOptions<DataObjectAttributes> = {
      where,
      include,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
    };

    const result = await DataObject.findAndCountAll(options) as any;

    const dataObjects: DataObjectListItem[] = result.rows.map((obj: any) => ({
      id: obj.id,
      name: obj.name,
      description: obj.description,
      data_source_id: obj.data_source_id,
      data_source_name: obj.dataSource?.name,
      data_source_type: obj.dataSource?.type,
      query_statement: obj.query_statement,
      primary_key: obj.primary_key,
      display_template: obj.display_template,
      sync_enabled: obj.sync_enabled,
      sync_cron: obj.sync_cron,
      sync_strategy: obj.sync_strategy,
      last_sync_at: obj.last_sync_at,
      last_sync_status: obj.last_sync_status,
      sync_count: obj.sync_count,
      status: obj.status,
      created_at: obj.created_at,
      updated_at: obj.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        list: dataObjects,
        pagination: {
          page,
          pageSize,
          total: result.count,
          totalPages: Math.ceil(result.count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取数据对象列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据对象列表失败' },
      { status: 500 }
    );
  }
}

interface CreateDataObjectBody {
  name: string;
  description?: string;
  data_source_id: number;
  query_statement: string;
  primary_key: string;
  display_template?: string;
  sync_enabled?: boolean;
  sync_cron?: string;
  sync_strategy?: string;
  created_by?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateDataObjectBody = await request.json();
    const {
      name,
      description,
      data_source_id,
      query_statement,
      primary_key,
      display_template,
      sync_enabled,
      sync_cron,
      sync_strategy,
      created_by,
    } = body;

    if (!name || !data_source_id || !query_statement || !primary_key) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const dataSource = await DataSource.findByPk(data_source_id);
    if (!dataSource) {
      return NextResponse.json(
        { success: false, message: '数据源不存在' },
        { status: 400 }
      );
    }

    const dataObject = await DataObject.create({
      name,
      description,
      data_source_id,
      query_statement,
      primary_key,
      display_template: display_template || '{{id}}',
      sync_enabled: sync_enabled || false,
      sync_cron: sync_cron || null,
      sync_strategy: sync_strategy || 'full',
      status: 'active',
      created_by: created_by || 1,
    });

    const jsonData = dataObject.toJSON();

    return NextResponse.json({
      success: true,
      message: '数据对象创建成功',
      data: {
        id: jsonData.id,
        name: jsonData.name,
        description: jsonData.description,
        data_source_id: jsonData.data_source_id,
        query_statement: jsonData.query_statement,
        primary_key: jsonData.primary_key,
        display_template: jsonData.display_template,
        sync_enabled: jsonData.sync_enabled,
        sync_cron: jsonData.sync_cron,
        sync_strategy: jsonData.sync_strategy,
        status: jsonData.status,
        created_at: jsonData.created_at,
      },
    });
  } catch (error) {
    console.error('创建数据对象失败:', error);
    return NextResponse.json(
      { success: false, message: '创建数据对象失败' },
      { status: 500 }
    );
  }
}
