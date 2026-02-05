import { NextRequest, NextResponse } from 'next/server';
import { TagGroup } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await TagGroup.findByPk(id, {
      include: [
        { model: TagGroup, as: 'parent', attributes: ['id', 'name', 'code'] },
        { model: TagGroup, as: 'children', attributes: ['id', 'name', 'code'] },
      ],
    }) as any;

    if (!group) {
      return NextResponse.json(
        { success: false, message: '标签分组不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        code: group.code,
        color: group.color,
        description: group.description,
        status: group.status,
        sort_order: group.sort_order,
        parent_id: group.parent_id,
        parent: group.parent,
        children: group.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          code: child.code,
        })),
        created_at: group.created_at,
        updated_at: group.updated_at,
      },
    });
  } catch (error) {
    console.error('获取标签分组详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签分组详情失败' },
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
    const { name, code, parent_id, description, color, sort_order, status } = body;

    const group = await TagGroup.findByPk(id) as any;
    if (!group) {
      return NextResponse.json(
        { success: false, message: '标签分组不存在' },
        { status: 404 }
      );
    }

    if (code && code !== group.code) {
      const existingGroup = await TagGroup.findOne({ where: { code } }) as any;
      if (existingGroup) {
        return NextResponse.json(
          { success: false, message: '分组编码已存在' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (parent_id !== undefined) updateData.parent_id = parent_id || null;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (status !== undefined) updateData.status = status;

    await group.update(updateData);

    return NextResponse.json({
      success: true,
      message: '标签分组更新成功',
      data: {
        id: group.id,
        name: group.name,
        code: group.code,
        color: group.color,
        description: group.description,
        status: group.status,
        sort_order: group.sort_order,
        parent_id: group.parent_id,
        updated_at: group.updated_at,
      },
    });
  } catch (error) {
    console.error('更新标签分组失败:', error);
    return NextResponse.json(
      { success: false, message: '更新标签分组失败' },
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
    const group = await TagGroup.findByPk(id) as any;

    if (!group) {
      return NextResponse.json(
        { success: false, message: '标签分组不存在' },
        { status: 404 }
      );
    }

    const childGroups = await TagGroup.findAll({ where: { parent_id: id } }) as any[];
    if (childGroups.length > 0) {
      return NextResponse.json(
        { success: false, message: '该分组存在子分组，请先删除子分组' },
        { status: 400 }
      );
    }

    await group.destroy();

    return NextResponse.json({
      success: true,
      message: '标签分组删除成功',
    });
  } catch (error) {
    console.error('删除标签分组失败:', error);
    return NextResponse.json(
      { success: false, message: '删除标签分组失败' },
      { status: 500 }
    );
  }
}
