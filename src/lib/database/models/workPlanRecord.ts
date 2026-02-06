import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const WorkPlanRecord = sequelize.define('WorkPlanRecord', {
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
  record_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '数据记录ID',
  },
  status: {
    type: DataTypes.ENUM('pending', 'tagged', 'skipped'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '状态：pending/tagged/skipped',
  },
  tagged_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '打标人ID',
  },
  tagged_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '打标时间',
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '打标的标签ID',
  },
}, {
  tableName: 'tagfactory_work_plan_records',
  modelName: 'WorkPlanRecord',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_work_plan',
      fields: ['work_plan_id'],
    },
    {
      name: 'idx_record',
      fields: ['record_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
    {
      name: 'unique_work_plan_record',
      fields: ['work_plan_id', 'record_id'],
      unique: true,
    },
  ],
});

export default WorkPlanRecord;
