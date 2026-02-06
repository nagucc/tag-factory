import sequelize from '@/lib/database/mysql';
import { QueryInterface, DataTypes } from 'sequelize';

async function updateEnum() {
  try {
    const queryInterface = sequelize.getQueryInterface() as QueryInterface;
    
    console.log('正在更新 status 字段的 ENUM 类型...');
    
    await queryInterface.changeColumn(
      'tagfactory_work_plan_records',
      'status',
      {
        type: DataTypes.ENUM('pending', 'tagged', 'skipped'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '状态：pending/tagged/skipped',
      }
    );
    
    console.log('更新成功！');
    process.exit(0);
  } catch (error) {
    console.error('更新失败:', error);
    process.exit(1);
  }
}

updateEnum();
