import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const DataRecord = sequelize.define('DataRecord', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  data_object_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '关联数据对象ID',
  },
  record_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '记录主键值（对应源数据主键）',
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '完整原始数据',
  },
  _synced_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '同步时间',
  },
  _sync_status: {
    type: DataTypes.ENUM('active', 'removed'),
    allowNull: false,
    defaultValue: 'active',
    comment: '同步状态：active/removed',
  },
}, {
  tableName: 'tagfactory_data_records',
  modelName: 'DataRecord',
  timestamps: false,
  createdAt: '_synced_at',
  updatedAt: false,
});

export default DataRecord;
