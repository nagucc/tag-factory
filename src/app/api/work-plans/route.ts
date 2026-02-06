import { NextRequest, NextResponse } from 'next/server';
import { WorkPlan, DataObject, User, WorkPlanTag, WorkPlanMember, WorkPlanRecord } from '@/lib/database/models';
import sequelize from '@/lib/database/mysql';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const dataObjectId = searchParams.get('dataObjectId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: any = {};
    if (dataObjectId) where.data_object_id = dataObjectId;
    if (status) where.status = status;

    let includeOptions: any[] = [
      { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
      { model: User, as: 'creator', attributes: ['id', 'username'] },
    ];

    if (userId) {
      includeOptions.push({
        model: WorkPlanMember,
        as: 'workPlanMembers',
        where: { user_id: userId },
        required: true,
      });
    }

    const { count, rows } = await WorkPlan.findAndCountAll({
      where,
      include: includeOptions,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const workPlansWithStats = await Promise.all(
      rows.map(async (workPlan) => {
        const workPlanData = workPlan.toJSON() as any;
        const memberCount = await WorkPlanMember.count({ where: { work_plan_id: workPlanData.id } });
        const taggedCount = await WorkPlanRecord.count({ 
          where: { work_plan_id: workPlanData.id, status: 'tagged' } 
        });
        
        return {
          ...workPlanData,
          data_object_name: workPlanData.dataObject?.name,
          creator_name: workPlanData.creator?.username,
          memberCount,
          progress: workPlanData.total_records > 0 
            ? Math.round((taggedCount / workPlanData.total_records) * 100) 
            : 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        list: workPlansWithStats,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('获取工作计划列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作计划列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const transaction = await sequelize.transaction();
  
  try {
    const body = await request.json();
    const { name, description, data_object_id, tag_ids, member_ids, user_id } = body;

    if (!name || !data_object_id) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '缺少必填字段' },
        { status: 400 }
      );
    }

    const dataObject = await DataObject.findByPk(data_object_id);
    if (!dataObject) {
      await transaction.rollback();
      return NextResponse.json(
        { success: false, message: '数据对象不存在' },
        { status: 400 }
      );
    }

    const creatorId = user_id || 1;

    const workPlan = await WorkPlan.create({
      name,
      description,
      data_object_id,
      status: 'active',
      total_records: 0,
      tagged_records: 0,
      started_at: new Date(),
      created_by: creatorId,
    }, { transaction });

    const workPlanData = workPlan.toJSON() as any;

    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await WorkPlanTag.create({
          work_plan_id: workPlanData.id,
          tag_id: tagId,
        }, { transaction });
      }
    }

    if (member_ids && member_ids.length > 0) {
      for (const memberId of member_ids) {
        await WorkPlanMember.create({
          work_plan_id: workPlanData.id,
          user_id: memberId,
          role: memberId === creatorId ? 'owner' : 'member',
        }, { transaction });
      }
    } else {
      await WorkPlanMember.create({
        work_plan_id: workPlanData.id,
        user_id: creatorId,
        role: 'owner',
      }, { transaction });
    }

    await transaction.commit();

    const fullWorkPlan = await WorkPlan.findByPk(workPlanData.id, {
      include: [
        { model: DataObject, as: 'dataObject', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] },
        { 
          model: WorkPlanTag, 
          as: 'workPlanTags',
          include: [{ model: require('@/lib/database/models').Tag, as: 'tag' }]
        },
        { 
          model: WorkPlanMember, 
          as: 'workPlanMembers',
          include: [{ model: User, as: 'user' }]
        },
      ],
    });

    return NextResponse.json({
      success: true,
      data: fullWorkPlan,
      message: '工作计划创建成功',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建工作计划失败:', error);
    return NextResponse.json(
      { success: false, message: '创建工作计划失败' },
      { status: 500 }
    );
  }
}
