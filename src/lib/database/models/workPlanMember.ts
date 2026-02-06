import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const WorkPlanMember = sequelize.define('WorkPlanMember', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  work_plan_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '工作计划ID',
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID',
  },
  role: {
    type: DataTypes.ENUM('owner', 'member'),
    allowNull: false,
    defaultValue: 'member',
    comment: '角色：owner/member',
  },
  tagged_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '打标数量',
  },
  joined_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '加入时间',
  },
}, {
  tableName: 'tagfactory_work_plan_members',
  modelName: 'WorkPlanMember',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_work_plan',
      fields: ['work_plan_id'],
    },
    {
      name: 'idx_user',
      fields: ['user_id'],
    },
    {
      name: 'unique_work_plan_user',
      fields: ['work_plan_id', 'user_id'],
      unique: true,
    },
  ],
});

export default WorkPlanMember;
