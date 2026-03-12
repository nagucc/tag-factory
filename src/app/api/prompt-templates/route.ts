import { NextRequest, NextResponse } from 'next/server';
import { PromptTemplate, User } from '@/lib/database/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const category = searchParams.get('category');
    const isPreset = searchParams.get('is_preset');

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isPreset !== null && isPreset !== undefined) {
      where.is_preset = isPreset === 'true';
    }

    const { count, rows } = await PromptTemplate.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'name'],
      }],
      order: [['use_count', 'DESC'], ['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const templates = rows.map(t => t.toJSON());

    const allTemplates = await PromptTemplate.findAll({
      attributes: ['category'],
      where: { category: { $ne: null } },
      group: ['category'],
    });
    const categories = allTemplates.map(t => (t as any).category).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        list: templates,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
        categories,
      },
    });
  } catch (error) {
    console.error('获取提示词模板列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取提示词模板列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, prompt, description, is_preset = false, created_by } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { success: false, message: '模板名称和提示词内容不能为空' },
        { status: 400 }
      );
    }

    const template = await PromptTemplate.create({
      name,
      category: category || null,
      prompt,
      description: description || null,
      is_preset,
      use_count: 0,
      created_by: created_by || null,
    });

    return NextResponse.json({
      success: true,
      data: template.toJSON(),
      message: '模板创建成功',
    });
  } catch (error) {
    console.error('创建提示词模板失败:', error);
    return NextResponse.json(
      { success: false, message: '创建提示词模板失败' },
      { status: 500 }
    );
  }
}
