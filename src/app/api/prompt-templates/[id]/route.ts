import { NextRequest, NextResponse } from 'next/server';
import { PromptTemplate } from '@/lib/database/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template.toJSON(),
    });
  } catch (error) {
    console.error('获取提示词模板详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取提示词模板详情失败' },
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
    const { name, category, prompt, description } = body;

    const template = await PromptTemplate.findByPk(id);
    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      );
    }

    const templateData = template.toJSON() as any;
    if (templateData.is_preset) {
      return NextResponse.json(
        { success: false, message: '预设模板不能修改' },
        { status: 403 }
      );
    }

    await template.update({
      name: name || templateData.name,
      category: category !== undefined ? category : templateData.category,
      prompt: prompt || templateData.prompt,
      description: description !== undefined ? description : templateData.description,
    });

    return NextResponse.json({
      success: true,
      data: template.toJSON(),
      message: '模板更新成功',
    });
  } catch (error) {
    console.error('更新提示词模板失败:', error);
    return NextResponse.json(
      { success: false, message: '更新提示词模板失败' },
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

    const template = await PromptTemplate.findByPk(id);
    if (!template) {
      return NextResponse.json(
        { success: false, message: '模板不存在' },
        { status: 404 }
      );
    }

    const templateData = template.toJSON() as any;
    if (templateData.is_preset) {
      return NextResponse.json(
        { success: false, message: '预设模板不能删除' },
        { status: 403 }
      );
    }

    await template.destroy();

    return NextResponse.json({
      success: true,
      message: '模板删除成功',
    });
  } catch (error) {
    console.error('删除提示词模板失败:', error);
    return NextResponse.json(
      { success: false, message: '删除提示词模板失败' },
      { status: 500 }
    );
  }
}
