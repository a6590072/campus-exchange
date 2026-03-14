const { mockItems, mockUsers, mockExchanges, mockMessages, mockStats } = require('../data/mockData');

// 获取物品列表
exports.getItems = (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  
  let items = [...mockItems];
  
  // 按分类筛选
  if (category && category !== '全部') {
    items = items.filter(item => item.category === category);
  }
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginatedItems = items.slice(start, end);
  
  res.json({
    success: true,
    data: {
      list: paginatedItems,
      total: items.length,
      page: parseInt(page),
      totalPages: Math.ceil(items.length / limit)
    }
  });
};

// 获取物品详情
exports.getItemDetail = (req, res) => {
  const { id } = req.params;
  const item = mockItems.find(i => i.id === parseInt(id));
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: '物品不存在'
    });
  }
  
  res.json({
    success: true,
    data: item
  });
};

// 获取首页数据
exports.getHomeData = (req, res) => {
  // 获取最新的6个物品
  const latestItems = mockItems.slice(0, 6);
  
  // 获取热门物品（按浏览量排序）
  const hotItems = [...mockItems]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 4);
  
  res.json({
    success: true,
    data: {
      stats: mockStats,
      latestItems,
      hotItems,
      banners: [
        { id: 1, image: 'https://picsum.photos/750/300?random=101', title: '校园交换季' },
        { id: 2, image: 'https://picsum.photos/750/300?random=102', title: 'AI智能估价' },
        { id: 3, image: 'https://picsum.photos/750/300?random=103', title: '安全交换指南' }
      ]
    }
  });
};

// 获取用户信息
exports.getUserProfile = (req, res) => {
  const userId = req.userId || 1;
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }
  
  // 获取用户的物品
  const userItems = mockItems.filter(item => item.owner_nickname === user.nickname);
  
  res.json({
    success: true,
    data: {
      ...user,
      items: userItems
    }
  });
};

// 获取消息列表
exports.getMessages = (req, res) => {
  const userId = req.userId || 1;
  
  // 获取与该用户相关的消息
  const messages = mockMessages.filter(
    msg => msg.sender_id === userId || msg.receiver_id === userId
  );
  
  res.json({
    success: true,
    data: {
      list: messages,
      unreadCount: messages.filter(m => m.receiver_id === userId && !m.is_read).length
    }
  });
};

// 获取交换请求列表
exports.getExchanges = (req, res) => {
  const userId = req.userId || 1;
  const { type } = req.query; // 'sent' 或 'received'
  
  let exchanges = mockExchanges;
  
  if (type === 'sent') {
    exchanges = exchanges.filter(e => e.requester_id === userId);
  } else if (type === 'received') {
    exchanges = exchanges.filter(e => e.owner_id === userId);
  }
  
  res.json({
    success: true,
    data: {
      list: exchanges,
      pendingCount: mockExchanges.filter(e => e.owner_id === userId && e.status === 'pending').length
    }
  });
};

// 搜索物品
exports.searchItems = (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword) {
    return res.json({
      success: true,
      data: { list: [] }
    });
  }
  
  const items = mockItems.filter(item => 
    item.title.includes(keyword) || 
    item.description.includes(keyword) ||
    item.tags.some(tag => tag.includes(keyword))
  );
  
  res.json({
    success: true,
    data: {
      list: items,
      total: items.length
    }
  });
};

// 获取分类列表
exports.getCategories = (req, res) => {
  const categories = [
    { id: 1, name: '电子产品', icon: '💻', count: 1256 },
    { id: 2, name: '书籍教材', icon: '📚', count: 892 },
    { id: 3, name: '生活用品', icon: '🏠', count: 678 },
    { id: 4, name: '运动户外', icon: '⚽', count: 345 },
    { id: 5, name: '服装鞋帽', icon: '👕', count: 234 },
    { id: 6, name: '美妆护肤', icon: '💄', count: 156 },
    { id: 7, name: '食品饮料', icon: '🍔', count: 89 },
    { id: 8, name: '其他', icon: '📦', count: 56 }
  ];
  
  res.json({
    success: true,
    data: categories
  });
};
