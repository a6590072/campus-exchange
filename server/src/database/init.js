const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

async function initDatabase() {
  try {
    console.log('🔄 开始初始化数据库...');
    
    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // 执行 SQL
    await query(sql);
    
    console.log('✅ 数据库初始化完成！');
    console.log('📊 已创建以下表：');
    console.log('   - users (用户表)');
    console.log('   - categories (分类表)');
    console.log('   - items (物品表)');
    console.log('   - favorites (收藏表)');
    console.log('   - exchange_requests (交换请求表)');
    console.log('   - exchange_messages (交换消息表)');
    console.log('   - view_history (浏览记录表)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
