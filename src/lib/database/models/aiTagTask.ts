import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const AITagTask = sequelize.define('AITagTask', {
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
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '打标提示词',
  },
  page_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    comment: '每页记录数',
  },
  total_records: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总记录数',
  },
  success_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '成功数',
  },
  fail_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '失败数',
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '状态：pending/running/completed/failed',
  },
  result_json: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '打标结果详情',
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '操作人ID',
  },
}, {
  tableName: 'tagfactory_ai_tag_tasks',
  modelName: 'AITagTask',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_work_plan',
      fields: ['work_plan_id'],
    },
    {
      name: 'idx_status',
      fields: ['status'],
    },
  ],
});

export default AITagTask;
