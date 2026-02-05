import sequelize from '../src/lib/database/mysql.js';
import { Tag } from '../src/lib/database/models/index.js';

async function testTagsAPI() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    const tags = await Tag.findAll({
      order: [['sort_order', 'ASC'], ['created_at', 'DESC']],
    });
    console.log('标签数量:', tags.length);
    console.log('标签数据:', JSON.stringify(tags, null, 2));

    const buildTree = (parentId) => {
      return tags
        .filter((tag) => {
          const pid = tag.parent_id || null;
          return pid === parentId;
        })
        .map((tag) => ({
          id: tag.id,
          key: tag.id,
          title: tag.name,
          name: tag.name,
          code: tag.code,
          type: tag.type,
          color: tag.color,
          description: tag.description,
          status: tag.status,
          sort_order: tag.sort_order,
          parent_id: tag.parent_id,
          children: buildTree(tag.id),
        }));
    };

    const treeData = buildTree(null);
    console.log('树形数据:', JSON.stringify(treeData, null, 2));

    await sequelize.close();
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testTagsAPI();
