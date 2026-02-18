import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const TagApplication = sequelize.define('TagApplication', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '标签ID',
  },
  data_object_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '数据对象ID',
  },
  record_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '记录ID（为空表示对象级标签）',
  },
  applied_by: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '应用人ID',
  },
  applied_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '应用时间',
  },
  source: {
    type: DataTypes.ENUM('manual', 'auto', 'import', 'workplan'),
    allowNull: false,
    defaultValue: 'manual',
    comment: '来源：manual/auto/import/workplan',
  },
  status: {
    type: DataTypes.ENUM('active', 'removed'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态：active/removed',
  },
  removed_by: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '移除人ID',
  },
  removed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '移除时间',
  },
}, {
  tableName: 'tagfactory_tag_applications',
  modelName: 'TagApplication',
  timestamps: false,
  indexes: [
    {
      name: 'idx_tag',
      fields: ['tag_id']
    },
    {
      name: 'idx_data_object',
      fields: ['data_object_id']
    },
    {
      name: 'idx_record',
      fields: ['record_id']
    },
    {
      name: 'idx_status',
      fields: ['status']
    }
  ],
});

export default TagApplication;
