import { NextRequest, NextResponse } from 'next/server';
import { DataSource } from '@/lib/database/models';
import { QueryTypes } from 'sequelize';
import sequelize from '@/lib/database/mysql';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {};
    if (name) {
      where.name = { [Symbol.for('sequelize.op')]: 'LIKE', ...{}, value: `%${name}%` };
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = parseInt(status);
    }

    const { count, rows } = await DataSource.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['created_at', 'DESC']],
    }) as any;

    return NextResponse.json({
      success: true,
      data: {
        list: rows.map((ds: any) => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          host: ds.host,
          port: ds.port,
          database: ds.database,
          status: ds.status,
          last_connection: ds.last_connection,
          description: ds.description,
          created_at: ds.created_at,
          updated_at: ds.updated_at,
        })),
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取数据源列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据源列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, host, port, database, username, password, description, options } = body;

    if (!name || !type || !host || !port || !database || !username || !password) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数' },
        { status: 400 }
      );
    }

    const dataSource = await DataSource.create({
      name,
      type,
      host,
      port,
      database,
      username,
      password,
      description,
      options,
      status: 1,
    }) as any;

    return NextResponse.json({
      success: true,
      message: '数据源创建成功',
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database,
        status: dataSource.status,
        description: dataSource.description,
        created_at: dataSource.created_at,
      },
    });
  } catch (error) {
    console.error('创建数据源失败:', error);
    return NextResponse.json(
      { success: false, message: '创建数据源失败' },
      { status: 500 }
    );
  }
}
