import { NextRequest, NextResponse } from 'next/server';
import { DataSource } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未认证' },
        { status: 401 }
      );
    }

    const dataSource = await DataSource.findOne({
      where: {
        id: parseInt(id),
        created_by: parseInt(userId),
      },
    }) as any;

    if (!dataSource) {
      return NextResponse.json(
        { success: false, message: '数据源不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database,
        username: dataSource.username,
        status: dataSource.status,
        description: dataSource.description,
        options: dataSource.options,
        last_connection: dataSource.last_connection,
        created_at: dataSource.created_at,
        updated_at: dataSource.updated_at,
      },
    });
  } catch (error) {
    console.error('获取数据源详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取数据源详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, host, port, database, username, password, description, options, status } = body;

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未认证' },
        { status: 401 }
      );
    }

    const dataSource = await DataSource.findOne({
      where: {
        id: parseInt(id),
        created_by: parseInt(userId),
      },
    }) as any;

    if (!dataSource) {
      return NextResponse.json(
        { success: false, message: '数据源不存在' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (host !== undefined) updateData.host = host;
    if (port !== undefined) updateData.port = port;
    if (database !== undefined) updateData.database = database;
    if (username !== undefined) updateData.username = username;
    if (password !== undefined && password) updateData.password = password;
    if (description !== undefined) updateData.description = description;
    if (options !== undefined) updateData.options = options;
    if (status !== undefined) updateData.status = status;

    await dataSource.update(updateData);

    return NextResponse.json({
      success: true,
      message: '数据源更新成功',
      data: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        host: dataSource.host,
        port: dataSource.port,
        database: dataSource.database,
        status: dataSource.status,
        description: dataSource.description,
        updated_at: dataSource.updated_at,
      },
    });
  } catch (error) {
    console.error('更新数据源失败:', error);
    return NextResponse.json(
      { success: false, message: '更新数据源失败' },
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
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '未认证' },
        { status: 401 }
      );
    }

    const dataSource = await DataSource.findOne({
      where: {
        id: parseInt(id),
        created_by: parseInt(userId),
      },
    }) as any;

    if (!dataSource) {
      return NextResponse.json(
        { success: false, message: '数据源不存在' },
        { status: 404 }
      );
    }

    await dataSource.destroy();

    return NextResponse.json({
      success: true,
      message: '数据源删除成功',
    });
  } catch (error) {
    console.error('删除数据源失败:', error);
    return NextResponse.json(
      { success: false, message: '删除数据源失败' },
      { status: 500 }
    );
  }
}
