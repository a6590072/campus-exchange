const { Pool } = require('pg');

// 内存数据库（当 PostgreSQL 不可用时使用）
const memoryDB = {
  items: [],
  users: [],
  categories: [],
  favorites: [],
  exchange_requests: [],
  exchange_messages: [],
  initialized: false
};

// 初始化内存数据库
function initMemoryDB() {
  if (memoryDB.initialized) return;
  
  console.log('🔄 初始化内存数据库...');
  
  // 添加默认分类
  memoryDB.categories = [
    { id: 'digital', name: '数码电子', icon: '💻', sort_order: 1 },
    { id: 'books', name: '图书教材', icon: '📚', sort_order: 2 },
    { id: 'clothes', name: '服饰鞋包', icon: '👕', sort_order: 3 },
    { id: 'sports', name: '运动户外', icon: '⚽', sort_order: 4 },
    { id: 'daily', name: '生活用品', icon: '🏠', sort_order: 5 },
    { id: 'beauty', name: '美妆护肤', icon: '💄', sort_order: 6 },
    { id: 'tickets', name: '票券卡券', icon: '🎫', sort_order: 7 },
    { id: 'others', name: '其他物品', icon: '📦', sort_order: 8 }
  ];
  
  // 添加示例物品
  memoryDB.items = [
    {
      id: 1,
      title: 'iPhone 14 Pro Max 256G 暗夜紫',
      description: '自用一手，成色99新，电池健康95%，带原装盒子和配件',
      images: ['https://picsum.photos/400/400?random=1'],
      category_id: 'digital',
      category_name: '数码电子',
      condition_level: '99新',
      want_description: '想换iPad Pro或者MacBook',
      status: 'active',
      view_count: 128,
      favorite_count: 15,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      owner_id: 1,
      owner_nickname: '数码达人',
      owner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      school_name: '武汉工商学院'
    },
    {
      id: 2,
      title: '考研数学复习全书',
      description: '张宇考研数学，基本全新，做了几页笔记',
      images: ['https://picsum.photos/400/400?random=2'],
      category_id: 'books',
      category_name: '图书教材',
      condition_level: '9成新',
      want_description: '换英语词汇书或者专业课资料',
      status: 'active',
      view_count: 86,
      favorite_count: 8,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      owner_id: 2,
      owner_nickname: '考研党',
      owner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      school_name: '武汉工商学院'
    },
    {
      id: 3,
      title: '耐克Air Force 1 42码',
      description: '经典纯白款，穿过几次，已清洗干净',
      images: ['https://picsum.photos/400/400?random=3'],
      category_id: 'clothes',
      category_name: '服饰鞋包',
      condition_level: '8成新',
      want_description: '换其他款式运动鞋',
      status: 'active',
      view_count: 256,
      favorite_count: 32,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      owner_id: 3,
      owner_nickname: '潮鞋控',
      owner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      school_name: '武汉工商学院'
    },
    {
      id: 4,
      title: '罗技G304无线鼠标',
      description: '游戏鼠标，反应灵敏，换了个新的所以出',
      images: ['https://picsum.photos/400/400?random=4'],
      category_id: 'digital',
      category_name: '数码电子',
      condition_level: '9成新',
      want_description: '换机械键盘或者耳机',
      status: 'active',
      view_count: 92,
      favorite_count: 12,
      created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      owner_id: 4,
      owner_nickname: '电竞少年',
      owner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
      school_name: '武汉工商学院'
    },
    {
      id: 5,
      title: '尤尼克斯羽毛球拍',
      description: '碳纤维超轻拍，适合新手，送手胶',
      images: ['https://picsum.photos/400/400?random=5'],
      category_id: 'sports',
      category_name: '运动户外',
      condition_level: '85成新',
      want_description: '换网球拍或者篮球',
      status: 'active',
      view_count: 67,
      favorite_count: 5,
      created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      owner_id: 5,
      owner_nickname: '运动健将',
      owner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
      school_name: '武汉工商学院'
    },
    {
      id: 6,
      title: '宜家台灯',
      description: '简约设计，暖光护眼，毕业带不走',
      images: ['https://picsum.photos/400/400?random=6'],
      category_id: 'daily',
      category_name: '生活用品',
      condition_level: '9成新',
      want_description: '换收纳盒或者小风扇',
      status: 'active',
      view_count: 45,
      favorite_count: 3,
      created_at: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
      owner_id: 6,
      owner_nickname: '毕业清仓',
      owner_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
      school_name: '武汉工商学院'
    }
  ];
  
  memoryDB.initialized = true;
  console.log('✅ 内存数据库初始化完成！');
}

// 检查是否使用内存数据库
let useMemoryDB = false;

// 支持 Render 的 DATABASE_URL 或本地配置
const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'campus_exchange',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

let pool = null;

// 尝试连接 PostgreSQL
try {
  pool = new Pool({
    ...connectionConfig,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL error:', err);
    useMemoryDB = true;
    initMemoryDB();
  });
  
  // 测试连接
  pool.query('SELECT NOW()', (err) => {
    if (err) {
      console.log('⚠️ PostgreSQL 连接失败，切换到内存数据库');
      useMemoryDB = true;
      initMemoryDB();
    } else {
      console.log('✅ PostgreSQL 连接成功');
    }
  });
} catch (error) {
  console.log('⚠️ PostgreSQL 初始化失败，切换到内存数据库');
  useMemoryDB = true;
  initMemoryDB();
}

const query = async (text, params) => {
  // 如果使用内存数据库
  if (useMemoryDB || !pool) {
    return memoryQuery(text, params);
  }
  
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    // 切换到内存数据库
    useMemoryDB = true;
    initMemoryDB();
    return memoryQuery(text, params);
  }
};

// 内存数据库查询模拟
function memoryQuery(text, params) {
  console.log('MemoryDB query:', text.substring(0, 50));
  
  // 简单的查询模拟
  if (text.toLowerCase().includes('select * from items')) {
    return { rows: memoryDB.items, rowCount: memoryDB.items.length };
  }
  
  if (text.toLowerCase().includes('select * from categories')) {
    return { rows: memoryDB.categories, rowCount: memoryDB.categories.length };
  }
  
  if (text.toLowerCase().includes('select') && text.toLowerCase().includes('where') && text.toLowerCase().includes('id')) {
    // 简单的 WHERE id 查询
    const id = params ? params[0] : null;
    if (text.toLowerCase().includes('items')) {
      const item = memoryDB.items.find(i => i.id === id);
      return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
    }
  }
  
  // 默认返回空结果
  return { rows: [], rowCount: 0 };
}

const transaction = async (callback) => {
  if (useMemoryDB || !pool) {
    // 内存数据库不支持事务，直接执行
    return callback({ query: memoryQuery });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// 获取内存数据库实例（供模型使用）
const getMemoryDB = () => {
  if (!memoryDB.initialized) {
    initMemoryDB();
  }
  return memoryDB;
};

module.exports = {
  pool,
  query,
  transaction,
  getMemoryDB,
  useMemoryDB: () => useMemoryDB
};
