import { NextRequest, NextResponse } from 'next/server';
import { TagGroup } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const name = searchParams.get('name');
    const status = searchParams.get('status');
    const tree = searchParams.get('tree');

    if (tree === 'true') {
      const groups = await TagGroup.findAll({
        where: {
          ...(status ? { status: parseInt(status) } : {}),
        },
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      }) as any[];

      const buildTree = (parentId: number | null): any[] => {
        return groups
          .filter(group => {
            const pid = group.parent_id || null;
            return pid === parentId;
          })
          .map(group => ({
            id: group.id,
            key: group.id,
            title: group.name,
            name: group.name,
            code: group.code,
            color: group.color,
            description: group.description,
            status: group.status,
            sort_order: group.sort_order,
            parent_id: group.parent_id,
            children: buildTree(group.id),
          }));
      };

      const treeData = buildTree(null);

      return NextResponse.json({
        success: true,
        data: treeData,
      });
    }

    const where: any = {};
    if (name) {
      where.name = { [Symbol.for('sequelize.op')]: 'LIKE', ...{}, value: `%${name}%` };
    }
    if (status) {
      where.status = parseInt(status);
    }

    const { count, rows } = await TagGroup.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    }) as any;

    return NextResponse.json({
      success: true,
      data: {
        list: rows.map((group: any) => ({
          id: group.id,
          name: group.name,
          code: group.code,
          color: group.color,
          description: group.description,
          status: group.status,
          sort_order: group.sort_order,
          parent_id: group.parent_id,
          created_at: group.created_at,
          updated_at: group.updated_at,
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
    console.error('获取标签分组列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签分组列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, parent_id, description, color, sort_order } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数：名称和编码' },
        { status: 400 }
      );
    }

    const existingGroup = await TagGroup.findOne({ where: { code } }) as any;
    if (existingGroup) {
      return NextResponse.json(
        { success: false, message: '分组编码已存在' },
        { status: 400 }
      );
    }

    const group = await TagGroup.create({
      name,
      code,
      parent_id: parent_id || null,
      description,
      color,
      sort_order: sort_order || 0,
      status: 1,
    }) as any;

    return NextResponse.json({
      success: true,
      message: '标签分组创建成功',
      data: {
        id: group.id,
        name: group.name,
        code: group.code,
        color: group.color,
        description: group.description,
        status: group.status,
        sort_order: group.sort_order,
        parent_id: group.parent_id,
        created_at: group.created_at,
      },
    });
  } catch (error) {
    console.error('创建标签分组失败:', error);
    return NextResponse.json(
      { success: false, message: '创建标签分组失败' },
      { status: 500 }
    );
  }
}
