import { NextRequest, NextResponse } from 'next/server';
import { WorkPlanTag, Tag, WorkPlan } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const workPlanTags = await WorkPlanTag.findAll({
      where: { work_plan_id: id },
      include: [
        { model: Tag, as: 'tag', attributes: ['id', 'name', 'color', 'code'] },
      ],
    });

    const tags = workPlanTags.map(wpt => {
      const wptData = wpt.toJSON() as any;
      return wptData.tag;
    });

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('获取工作计划标签失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作计划标签失败' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tag_id } = body;

    if (!tag_id) {
      return NextResponse.json(
        { success: false, message: '缺少标签ID' },
        { status: 400 }
      );
    }

    const workPlan = await WorkPlan.findByPk(id);
    if (!workPlan) {
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 400 }
      );
    }

    const [workPlanTag, created] = await WorkPlanTag.findOrCreate({
      where: {
        work_plan_id: id,
        tag_id,
      },
      defaults: {},
    });

    if (!created) {
      return NextResponse.json(
        { success: false, message: '该标签已存在' },
        { status: 400 }
      );
    }

    const fullTag = await WorkPlanTag.findByPk((workPlanTag.toJSON() as any).id, {
      include: [
        { model: Tag, as: 'tag', attributes: ['id', 'name', 'color', 'code'] },
      ],
    });

    const fullTagData = fullTag?.toJSON() as any;

    return NextResponse.json({
      success: true,
      data: fullTagData?.tag,
      message: '标签添加成功',
    });
  } catch (error) {
    console.error('添加工作计划标签失败:', error);
    return NextResponse.json(
      { success: false, message: '添加工作计划标签失败' },
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
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('tag_id');

    if (!tagId) {
      return NextResponse.json(
        { success: false, message: '缺少标签ID' },
        { status: 400 }
      );
    }

    const workPlanTag = await WorkPlanTag.findOne({
      where: { work_plan_id: id, tag_id: tagId },
    });

    if (!workPlanTag) {
      return NextResponse.json(
        { success: false, message: '标签不存在' },
        { status: 404 }
      );
    }

    await workPlanTag.destroy();

    return NextResponse.json({
      success: true,
      message: '标签移除成功',
    });
  } catch (error) {
    console.error('移除工作计划标签失败:', error);
    return NextResponse.json(
      { success: false, message: '移除工作计划标签失败' },
      { status: 500 }
    );
  }
}
