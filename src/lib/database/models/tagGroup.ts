import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const TagGroup = sequelize.define('TagGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '分组名称',
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '分组编码',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '分组描述',
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '分组颜色',
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '父分组ID',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序顺序',
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '0: 禁用, 1: 启用',
  },
}, {
  tableName: 'tagfactory_tag_groups',
  modelName: 'TagGroup',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default TagGroup;
