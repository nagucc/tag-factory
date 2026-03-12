import { DataTypes } from 'sequelize';
import sequelize from '../mysql';

const DataSource = sequelize.define('DataSource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '数据源名称',
  },
  type: {
    type: DataTypes.ENUM('mysql', 'mongodb', 'postgresql', 'oracle', 'sqlite', 'mssql'),
    allowNull: false,
    comment: '数据源类型',
  },
  host: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '主机地址',
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '端口号',
  },
  database: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '数据库名称',
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '用户名',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码',
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '0: 禁用, 1: 启用',
  },
  last_connection: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后连接时间',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '数据源描述',
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '额外配置选项',
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建人ID',
  },
}, {
  tableName: 'tagfactory_data_sources',
  modelName: 'DataSource',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default DataSource;
