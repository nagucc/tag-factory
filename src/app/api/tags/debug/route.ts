import { NextRequest, NextResponse } from 'next/server';
import { Tag } from '@/lib/database/models';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const tags = await Tag.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    }) as any[];

    console.log('数据库中的标签:', JSON.stringify(tags, null, 2));

    const buildTree = (parentId: number | null): any[] => {
      return tags
        .filter(tag => {
          const pid = tag.parent_id || null;
          return pid === parentId;
        })
        .map(tag => ({
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
          children: buildTree(tag.id),
        }));
    };

    const treeData = buildTree(null);
    console.log('树形数据:', JSON.stringify(treeData, null, 2));

    return NextResponse.json({
      success: true,
      data: treeData,
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取标签列表失败' },
      { status: 500 }
    );
  }
}
