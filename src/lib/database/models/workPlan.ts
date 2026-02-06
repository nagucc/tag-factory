import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const WorkPlan = sequelize.define('WorkPlan', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '工作计划名称',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '工作计划描述',
  },
  data_object_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '关联数据对象ID',
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'archived'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态：active/active/archived',
  },
  total_records: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总记录数',
  },
  tagged_records: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '已打标记录数',
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始时间',
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间',
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '创建人ID',
  },
}, {
  tableName: 'tagfactory_work_plans',
  modelName: 'WorkPlan',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_data_object',
      fields: ['data_object_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
  ],
});

export default WorkPlan;
