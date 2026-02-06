import { NextRequest, NextResponse } from 'next/server';
import { TagRule, DataObject, Tag, User } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const dataObjectId = searchParams.get('dataObjectId');
    const tagId = searchParams.get('tagId');
    const enabled = searchParams.get('enabled');

    const where: any = {};
    if (dataObjectId) where.data_object_id = dataObjectId;
    if (tagId) where.tag_id = tagId;
    if (enabled !== null && enabled !== '') where.enabled = enabled === 'true';

    const { count, rows } = await TagRule.findAndCountAll({
      where,
      include: [
        { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
        { model: Tag, as: 'tag', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
      ],
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取标签规则列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签规则列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, expression, data_object_id, tag_id, priority, enabled, description } = body;

    if (!name || !expression || !data_object_id || !tag_id) {
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    const dataObject = await DataObject.findByPk(data_object_id);
    if (!dataObject) {
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 400 }
      );
    }

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 400 }
      );
    }

    const userId = body.userId || 1;

    const tagRule = await TagRule.create({
      name,
      expression,
      data_object_id,
      tag_id,
      priority: priority || 0,
      enabled: enabled !== false,
      description,
      created_by: userId,
    });

    return NextResponse.json({
      success: true,
      data: tagRule,
      message: '标签规则创建成功',
    });
  } catch (error) {
    console.error('创建标签规则失败:', error);
    return NextResponse.json(
      { success: false, message: '创建标签规则失败' },
      { status: 500 }
    );
  }
}
