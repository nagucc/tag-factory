import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const DataObject = sequelize.define('DataObject', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '数据对象名称',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '数据对象描述',
  },
  data_source_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '关联数据源ID',
  },
  query_statement: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '查询语句（SQL或MongoDB聚合管道）',
  },
  primary_key: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '源数据主键字段名',
  },
  display_template: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: '{{id}}',
    comment: '显示模板，如：{{name}}({{gender}})',
  },
  sync_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否启用同步',
  },
  sync_cron: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'CRON表达式',
  },
  sync_strategy: {
    type: DataTypes.ENUM('full', 'incremental'),
    allowNull: false,
    defaultValue: 'full',
    comment: '同步策略：full/incremental',
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后同步时间',
  },
  last_sync_status: {
    type: DataTypes.ENUM('success', 'failed', 'pending', 'running'),
    allowNull: true,
    comment: '同步状态：success/failed/pending/running',
  },
  sync_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '同步记录数',
  },
  status: {
    type: DataTypes.ENUM('active', 'disabled'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态：active/disabled',
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '创建人ID',
  },
}, {
  tableName: 'tagfactory_data_objects',
  modelName: 'DataObject',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default DataObject;
