import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const TagGroupRelation = sequelize.define('TagGroupRelation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '标签ID',
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '分组ID',
  },
}, {
  tableName: 'tagfactory_tag_group_relations',
  modelName: 'TagGroupRelation',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default TagGroupRelation;
