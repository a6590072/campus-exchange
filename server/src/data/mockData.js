// 模拟物品数据
const mockItems = [
  {
    id: 1,
    title: 'iPad Pro 11寸 128G 银色',
    description: '使用半年，保护得很好，带原装充电器。想换个相机或者游戏机。平时主要用来看网课，现在毕业了用不上。',
    category: '电子产品',
    condition: '95新',
    original_price: 6800,
    suggested_price: 4200,
    expected_items: '相机、Switch、PS5',
    images: ['https://picsum.photos/400/400?random=1'],
    owner_nickname: '小明同学',
    owner_avatar: 'https://picsum.photos/100/100?random=11',
    owner_school: '北京大学',
    view_count: 156,
    favorite_count: 23,
    created_at: '2026-03-10T10:30:00Z',
    tags: ['平板', '苹果', '学习'],
    ai_valuation: {
      min: 3800,
      max: 4500,
      suggested: 4200,
      confidence: 'high'
    }
  },
  {
    id: 2,
    title: '考研数学全书 李永乐版',
    description: '2025考研数学复习全书，只写过前几页，后面都是全新的。附赠视频课程账号。',
    category: '书籍教材',
    condition: '99新',
    original_price: 89,
    suggested_price: 45,
    expected_items: '英语词汇书、政治资料',
    images: ['https://picsum.photos/400/400?random=2'],
    owner_nickname: '考研党',
    owner_avatar: 'https://picsum.photos/100/100?random=12',
    owner_school: '清华大学',
    view_count: 89,
    favorite_count: 12,
    created_at: '2026-03-12T14:20:00Z',
    tags: ['考研', '数学', '教材'],
    ai_valuation: {
      min: 35,
      max: 55,
      suggested: 45,
      confidence: 'high'
    }
  },
  {
    id: 3,
    title: '宿舍用小冰箱 美的',
    description: '美的品牌，用了两年，功能正常，制冷效果好。容量50L，适合宿舍使用。想换个显示器或者键盘。',
    category: '生活用品',
    condition: '9成新',
    original_price: 599,
    suggested_price: 280,
    expected_items: '显示器、机械键盘',
    images: ['https://picsum.photos/400/400?random=3'],
    owner_nickname: '宿舍生活家',
    owner_avatar: 'https://picsum.photos/100/100?random=13',
    owner_school: '复旦大学',
    view_count: 234,
    favorite_count: 45,
    created_at: '2026-03-11T09:15:00Z',
    tags: ['冰箱', '宿舍', '家电'],
    ai_valuation: {
      min: 250,
      max: 320,
      suggested: 280,
      confidence: 'medium'
    }
  },
  {
    id: 4,
    title: 'AirPods Pro 2代 全新未拆封',
    description: '教育优惠买的，全新未拆封，有发票。想换机械键盘或者耳机支架。',
    category: '电子产品',
    condition: '全新',
    original_price: 1899,
    suggested_price: 1500,
    expected_items: '机械键盘、耳机支架',
    images: ['https://picsum.photos/400/400?random=4'],
    owner_nickname: '数码控',
    owner_avatar: 'https://picsum.photos/100/100?random=14',
    owner_school: '浙江大学',
    view_count: 312,
    favorite_count: 67,
    created_at: '2026-03-13T16:45:00Z',
    tags: ['耳机', '苹果', '全新'],
    ai_valuation: {
      min: 1400,
      max: 1600,
      suggested: 1500,
      confidence: 'high'
    }
  },
  {
    id: 5,
    title: '篮球鞋 李宁韦德之道',
    description: '43码，穿过几次，鞋底磨损很小。想换个足球或者羽毛球拍。',
    category: '运动户外',
    condition: '95新',
    original_price: 799,
    suggested_price: 380,
    expected_items: '足球、羽毛球拍',
    images: ['https://picsum.photos/400/400?random=5'],
    owner_nickname: '运动达人',
    owner_avatar: 'https://picsum.photos/100/100?random=15',
    owner_school: '南京大学',
    view_count: 178,
    favorite_count: 28,
    created_at: '2026-03-09T11:30:00Z',
    tags: ['球鞋', '篮球', '运动'],
    ai_valuation: {
      min: 320,
      max: 450,
      suggested: 380,
      confidence: 'medium'
    }
  },
  {
    id: 6,
    title: '机械键盘 樱桃轴',
    description: 'Cherry MX轴，红轴，手感很好。用了半年，功能正常，键帽无磨损。想换个鼠标或者耳机。',
    category: '电子产品',
    condition: '9成新',
    original_price: 499,
    suggested_price: 280,
    expected_items: '鼠标、耳机',
    images: ['https://picsum.photos/400/400?random=6'],
    owner_nickname: '键盘侠',
    owner_avatar: 'https://picsum.photos/100/100?random=16',
    owner_school: '武汉大学',
    view_count: 145,
    favorite_count: 19,
    created_at: '2026-03-08T13:20:00Z',
    tags: ['键盘', '外设', '游戏'],
    ai_valuation: {
      min: 250,
      max: 320,
      suggested: 280,
      confidence: 'high'
    }
  }
];

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    openid: 'mock_openid_001',
    nickname: '小明同学',
    avatar_url: 'https://picsum.photos/100/100?random=11',
    school_name: '北京大学',
    is_verified: true,
    credit_score: 95,
    item_count: 3,
    exchange_count: 5,
    favorite_count: 12
  },
  {
    id: 2,
    openid: 'mock_openid_002',
    nickname: '考研党',
    avatar_url: 'https://picsum.photos/100/100?random=12',
    school_name: '清华大学',
    is_verified: true,
    credit_score: 88,
    item_count: 8,
    exchange_count: 12,
    favorite_count: 25
  },
  {
    id: 3,
    openid: 'mock_openid_003',
    nickname: '宿舍生活家',
    avatar_url: 'https://picsum.photos/100/100?random=13',
    school_name: '复旦大学',
    is_verified: true,
    credit_score: 92,
    item_count: 5,
    exchange_count: 8,
    favorite_count: 18
  }
];

// 模拟交换请求数据
const mockExchanges = [
  {
    id: 1,
    requester_id: 1,
    requester_nickname: '小明同学',
    requester_avatar: 'https://picsum.photos/100/100?random=11',
    owner_id: 2,
    owner_nickname: '考研党',
    owner_avatar: 'https://picsum.photos/100/100?random=12',
    item_id: 2,
    item_title: '考研数学全书 李永乐版',
    item_image: 'https://picsum.photos/400/400?random=2',
    status: 'pending',
    message: '我对这本书很感兴趣，可以用我的英语词汇书换吗？',
    created_at: '2026-03-13T10:00:00Z'
  },
  {
    id: 2,
    requester_id: 3,
    requester_nickname: '宿舍生活家',
    requester_avatar: 'https://picsum.photos/100/100?random=13',
    owner_id: 1,
    owner_nickname: '小明同学',
    owner_avatar: 'https://picsum.photos/100/100?random=11',
    item_id: 1,
    item_title: 'iPad Pro 11寸 128G 银色',
    item_image: 'https://picsum.photos/400/400?random=1',
    status: 'accepted',
    message: '我有显示器可以换，方便见面看看吗？',
    created_at: '2026-03-12T15:30:00Z'
  }
];

// 模拟消息数据
const mockMessages = [
  {
    id: 1,
    sender_id: 2,
    sender_nickname: '考研党',
    sender_avatar: 'https://picsum.photos/100/100?random=12',
    receiver_id: 1,
    content: '你好，我对你的iPad很感兴趣！',
    created_at: '2026-03-13T14:30:00Z',
    is_read: false
  },
  {
    id: 2,
    sender_id: 3,
    sender_nickname: '宿舍生活家',
    sender_avatar: 'https://picsum.photos/100/100?random=13',
    receiver_id: 1,
    content: '显示器还在吗？我想看看实物',
    created_at: '2026-03-13T10:15:00Z',
    is_read: true
  }
];

// 模拟统计数据
const mockStats = {
  total_users: 1256,
  total_items: 3421,
  total_exchanges: 892,
  today_new_items: 23,
  today_new_users: 8,
  hot_categories: [
    { name: '电子产品', count: 1256 },
    { name: '书籍教材', count: 892 },
    { name: '生活用品', count: 678 },
    { name: '运动户外', count: 345 }
  ]
};

module.exports = {
  mockItems,
  mockUsers,
  mockExchanges,
  mockMessages,
  mockStats
};
