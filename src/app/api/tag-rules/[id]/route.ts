import { NextRequest, NextResponse } from 'next/server';
import { TagRule, DataObject, Tag } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tagRule = await TagRule.findByPk(id, {
      include: [
        { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
        { model: Tag, as: 'tag', attributes: ['id', 'name', 'color', 'code'] },
      ],
    });

    if (!tagRule) {
      return NextResponse.json(
        { success: false, message: '标签规则不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tagRule,
    });
  } catch (error) {
    console.error('获取标签规则详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签规则详情失败' },
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
    const { name, expression, data_object_id, tag_id, priority, enabled, description } = body;

    const tagRule = await TagRule.findByPk(id);
    if (!tagRule) {
      return NextResponse.json(
        { success: false, message: '标签规则不存在' },
        { status: 404 }
      );
    }

    const ruleData = tagRule.toJSON() as any;

    if (data_object_id) {
      const dataObject = await DataObject.findByPk(data_object_id);
      if (!dataObject) {
        return NextResponse.json(
          { success: false, message: '数据对象不存在' },
          { status: 400 }
        );
      }
    }

    if (tag_id) {
      const tag = await Tag.findByPk(tag_id);
      if (!tag) {
        return NextResponse.json(
          { success: false, message: '标签不存在' },
          { status: 400 }
        );
      }
    }

    await tagRule.update({
      name: name || ruleData.name,
      expression: expression || ruleData.expression,
      data_object_id: data_object_id || ruleData.data_object_id,
      tag_id: tag_id || ruleData.tag_id,
      priority: priority !== undefined ? priority : ruleData.priority,
      enabled: enabled !== undefined ? enabled : ruleData.enabled,
      description: description !== undefined ? description : ruleData.description,
    });

    return NextResponse.json({
      success: true,
      data: tagRule,
      message: '标签规则更新成功',
    });
  } catch (error) {
    console.error('更新标签规则失败:', error);
    return NextResponse.json(
      { success: false, message: '更新标签规则失败' },
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
    const tagRule = await TagRule.findByPk(id);

    if (!tagRule) {
      return NextResponse.json(
        { success: false, message: '标签规则不存在' },
        { status: 404 }
      );
    }

    await tagRule.destroy();

    return NextResponse.json({
      success: true,
      message: '标签规则删除成功',
    });
  } catch (error) {
    console.error('删除标签规则失败:', error);
    return NextResponse.json(
      { success: false, message: '删除标签规则失败' },
      { status: 500 }
    );
  }
}
