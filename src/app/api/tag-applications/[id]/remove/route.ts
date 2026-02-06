import { NextRequest, NextResponse } from 'next/server';
import { TagApplication } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, reason } = body;

    const application = await TagApplication.findByPk(id);
    
    if (!application) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '标签应用记录不存在' },
        { status: 404 }
      );
    }

    const appData = application.toJSON() as any;
    if (appData.status === 'removed') {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '该标签已被移除' },
        { status: 400 }
      );
    }

    await application.update({
      status: 'removed',
      removed_by: user_id || 1,
      removed_at: new Date(),
    }, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: application,
      message: '标签移除成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('移除标签失败:', error);
    return NextResponse.json(
      { success: false, message: '移除标签失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 1;

    const application = await TagApplication.findByPk(id);
    
    if (!application) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '标签应用记录不存在' },
        { status: 404 }
      );
    }

    const userIdInt = parseInt(userId as string) || 1;

    await application.update({
      status: 'removed',
      removed_by: userIdInt,
      removed_at: new Date(),
    }, { transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      data: application,
      message: '标签移除成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('移除标签失败:', error);
    return NextResponse.json(
      { success: false, message: '移除标签失败' },
      { status: 500 }
    );
  }
}
