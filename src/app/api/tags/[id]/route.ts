import { NextRequest, NextResponse } from 'next/server';
import { Tag } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tag = await Tag.findByPk(id, {
      include: [
        { model: Tag, as: 'parent', attributes: ['id', 'name', 'code'] },
        { model: Tag, as: 'children', attributes: ['id', 'name', 'code'] },
      ],
    }) as any;

    if (!tag) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
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
        parent: tag.parent,
        children: tag.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          code: child.code,
        })),
        created_at: tag.created_at,
        updated_at: tag.updated_at,
      },
    });
  } catch (error) {
    console.error('获取标签详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签详情失败' },
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
    const { name, code, parent_id, type, color, description, sort_order, status } = body;

    const tag = await Tag.findByPk(id) as any;
    if (!tag) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    if (code && code !== tag.code) {
      const existingTag = await Tag.findOne({ where: { code } }) as any;
      if (existingTag) {
        return NextResponse.json(
          { success: false, message: '标签编码已存在' },
          { status: 400 }
        );
      }
    }

    if (parent_id !== undefined) {
      if (parent_id === parseInt(id)) {
        return NextResponse.json(
          { success: false, message: '不能将标签设置为自己的子标签' },
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
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (parent_id !== undefined) updateData.parent_id = parent_id || null;
    if (type !== undefined) updateData.type = type;
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (status !== undefined) updateData.status = status;

    await tag.update(updateData);

    return NextResponse.json({
      success: true,
      message: '标签更新成功',
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
        updated_at: tag.updated_at,
      },
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { success: false, message: '更新标签失败' },
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
    const tag = await Tag.findByPk(id) as any;

    if (!tag) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    const childTags = await Tag.findAll({ where: { parent_id: id } }) as any[];
    if (childTags.length > 0) {
      return NextResponse.json(
        { success: false, message: '该标签存在子标签，请先删除子标签' },
        { status: 400 }
      );
    }

    await tag.destroy();

    return NextResponse.json({
      success: true,
      message: '标签删除成功',
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { success: false, message: '删除标签失败' },
      { status: 500 }
    );
  }
}
