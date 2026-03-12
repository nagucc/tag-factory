import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const PromptTemplate = sequelize.define('PromptTemplate', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '模板名称',
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '分类',
  },
  prompt: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '提示词内容',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '描述',
  },
  is_preset: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: '是否预设',
  },
  use_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '使用次数',
  },
  created_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '创建人ID',
  },
}, {
  tableName: 'tagfactory_prompt_templates',
  modelName: 'PromptTemplate',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      name: 'idx_category',
      fields: ['category'],
    },
    {
      name: 'idx_preset',
      fields: ['is_preset'],
    },
  ],
});

export default PromptTemplate;
