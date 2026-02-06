import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const WorkPlanTag = sequelize.define('WorkPlanTag', {
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
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '标签ID',
  },
}, {
  tableName: 'tagfactory_work_plan_tags',
  modelName: 'WorkPlanTag',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      name: 'idx_work_plan',
      fields: ['work_plan_id'],
    },
    {
      name: 'idx_tag',
      fields: ['tag_id'],
    },
    {
      name: 'unique_work_plan_tag',
      fields: ['work_plan_id', 'tag_id'],
      unique: true,
    },
  ],
});

export default WorkPlanTag;
