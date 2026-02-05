import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '标签名称',
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '标签编码',
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '父标签ID',
  },
  type: {
    type: DataTypes.ENUM('分类', '业务', '自定义'),
    allowNull: false,
    defaultValue: '自定义',
    comment: '标签类型',
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '#1890ff',
    comment: '标签颜色',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '标签描述',
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '0: 禁用, 1: 启用',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序',
  },
}, {
  tableName: 'tagfactory_tags',
  modelName: 'Tag',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Tag;
