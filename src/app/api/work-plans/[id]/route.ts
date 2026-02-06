import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, DataObject, User, WorkPlanTag, WorkPlanMember, WorkPlanRecord, Tag } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workPlan = await WorkPlan.findByPk(id, {
      include: [
        { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: WorkPlanTag, 
          as: 'workPlanTags',
          include: [{ model: Tag, as: 'tag', attributes: ['id', 'name', 'color', 'code'] }]
        },
        { 
          model: WorkPlanMember, 
          as: 'workPlanMembers',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
        },
      ],
    });

    if (!workPlan) {
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const taggedRecords = await WorkPlanRecord.count({
      where: { work_plan_id: id, status: 'tagged' }
    });

    const memberStats = await WorkPlanMember.findAll({
      where: { work_plan_id: id },
      attributes: [
        'user_id',
        'role',
        'tagged_count',
        [sequelize.col('user.username'), 'username'],
      ],
      include: [{ model: User, as: 'user', attributes: [] }],
      raw: true,
    });

    const workPlanData = workPlan.toJSON() as any;
    workPlanData.progress = workPlanData.total_records > 0 
      ? Math.round((taggedRecords / workPlanData.total_records) * 100) 
      : 0;
    workPlanData.memberStats = memberStats;

    return NextResponse.json({
      success: true,
      data: workPlanData,
    });
  } catch (error) {
    console.error('获取工作计划详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作计划详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, tag_ids, member_ids, status } = body;

    const workPlan = await WorkPlan.findByPk(id);
    if (!workPlan) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    const workPlanData = workPlan.toJSON() as any;

    await workPlan.update({
      name: name || workPlanData.name,
      description: description !== undefined ? description : workPlanData.description,
      status: status || workPlanData.status,
    }, { transaction });

    if (status === 'completed') {
      await workPlan.update({
        completed_at: new Date(),
      }, { transaction });
    }

    if (tag_ids !== undefined) {
      await WorkPlanTag.destroy({ where: { work_plan_id: id }, transaction });
      for (const tagId of tag_ids) {
        await WorkPlanTag.create({
          work_plan_id: id,
          tag_id: tagId,
        }, { transaction });
      }
    }

    if (member_ids !== undefined) {
      const currentMembers = await WorkPlanMember.findAll({
        where: { work_plan_id: id },
        attributes: ['user_id'],
        raw: true,
      });
      
      const currentMemberIds = currentMembers.map((m: any) => m.user_id);
      const membersToRemove = currentMemberIds.filter((uid: number) => !member_ids.includes(uid));
      const membersToAdd = member_ids.filter((uid: number) => !currentMemberIds.includes(uid));

      if (membersToRemove.length > 0) {
        await WorkPlanMember.destroy({
          where: { work_plan_id: id, user_id: membersToRemove },
          transaction,
        });
      }

      for (const memberId of membersToAdd) {
        await WorkPlanMember.create({
          work_plan_id: id,
          user_id: memberId,
          role: 'member',
        }, { transaction });
      }
    }

    await transaction.commit();

    const updatedWorkPlan = await WorkPlan.findByPk(id, {
      include: [
        { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: WorkPlanTag, 
          as: 'workPlanTags',
          include: [{ model: Tag, as: 'tag', attributes: ['id', 'name', 'color', 'code'] }]
        },
        { 
          model: WorkPlanMember, 
          as: 'workPlanMembers',
          include: [{ model: User, as: 'user', attributes: ['id', 'username', 'email'] }]
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: updatedWorkPlan,
      message: '工作计划更新成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新工作计划失败:', error);
    return NextResponse.json(
      { success: false, message: '更新工作计划失败' },
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
    const workPlan = await WorkPlan.findByPk(id);

    if (!workPlan) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '工作计划不存在' },
        { status: 404 }
      );
    }

    await WorkPlanRecord.destroy({ where: { work_plan_id: id }, transaction });
    await WorkPlanMember.destroy({ where: { work_plan_id: id }, transaction });
    await WorkPlanTag.destroy({ where: { work_plan_id: id }, transaction });
    await workPlan.destroy({ transaction });

    await transaction.commit();

    return NextResponse.json({
      success: true,
      message: '工作计划删除成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('删除工作计划失败:', error);
    return NextResponse.json(
      { success: false, message: '删除工作计划失败' },
      { status: 500 }
    );
  }
}
