import { NextRequest, NextResponse } from 'next/server';
import { Tag } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const parentId = searchParams.get('parent_id');
    const tree = searchParams.get('tree');

    if (tree === 'true') {
      const tags = await Tag.findAll({
        where: {
          ...(status ? { status: parseInt(status) } : {}),
          ...(type ? { type } : {}),
        },
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
      }) as any[];

      const buildTree = (parentId: number | null): any[] => {
        return tags
          .filter(tag => {
            const pid = tag.parent_id || null;
            return pid === parentId;
          })
          .map(tag => {
            const children = buildTree(tag.id);
            return {
              id: tag.id,
              key: tag.id,
              title: tag.name,
              name: tag.name,
              code: tag.code,
              type: tag.type,
              color: tag.color,
              description: tag.description,
              status: tag.status,
              sort_order: tag.sort_order,
              parent_id: tag.parent_id,
              ...(children.length > 0 && { children }),
            };
          });
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
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = parseInt(status);
    }
    if (parentId) {
      where.parent_id = parentId === 'null' ? null : parseInt(parentId);
    }

    const { count, rows } = await Tag.findAndCountAll({
      where,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    }) as any;

    return NextResponse.json({
      success: true,
      data: {
        list: rows.map((tag: any) => ({
          id: tag.id,
          name: tag.name,
          code: tag.code,
          type: tag.type,
          color: tag.color,
          description: tag.description,
          status: tag.status,
          sort_order: tag.sort_order,
          parent_id: tag.parent_id,
          created_at: tag.created_at,
          updated_at: tag.updated_at,
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
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, parent_id, type, color, description, sort_order } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: '缺少必要参数：名称和编码' },
        { status: 400 }
      );
    }

    const existingTag = await Tag.findOne({ where: { code } }) as any;
    if (existingTag) {
      return NextResponse.json(
        { success: false, message: '标签编码已存在' },
        { status: 400 }
      );
    }

    if (parent_id) {
      const parentTag = await Tag.findByPk(parent_id) as any;
      if (!parentTag) {
        return NextResponse.json(
          { success: false, message: '父标签不存在' },
          { status: 400 }
        );
      }
    }

    const tag = await Tag.create({
      name,
      code,
      parent_id: parent_id || null,
      type: type || '自定义',
      color: color || '#1890ff',
      description,
      sort_order: sort_order || 0,
      status: 1,
    }) as any;

    return NextResponse.json({
      success: true,
      message: '标签创建成功',
      data: {
        id: tag.id,
        name: tag.name,
        code: tag.code,
        type: tag.type,
        color: tag.color,
        description: tag.description,
        status: tag.status,
        sort_order: tag.sort_order,
        parent_id: tag.parent_id,
        created_at: tag.created_at,
      },
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { success: false, message: '创建标签失败' },
      { status: 500 }
    );
  }
}
