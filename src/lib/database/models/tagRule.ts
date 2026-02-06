import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const TagRule = sequelize.define('TagRule', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '规则名称',
  },
  expression: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '规则表达式（如：data.age > 18）',
  },
  data_object_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '关联数据对象ID',
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '匹配的标签ID',
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '优先级（数值越大优先级越高）',
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否启用',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '规则描述',
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '创建人ID',
  },
}, {
  tableName: 'tagfactory_tag_rules',
  modelName: 'TagRule',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_data_object',
      fields: ['data_object_id'],
    },
    {
      name: 'idx_tag',
      fields: ['tag_id'],
    },
    {
      name: 'idx_enabled',
      fields: ['enabled'],
    },
  ],
});

export default TagRule;
