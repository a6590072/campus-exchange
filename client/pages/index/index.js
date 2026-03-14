const app = getApp();

Page({
  data: {
    categories: [
      { id: 'digital', name: '数码电子', icon: '💻', bgColor: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)' },
      { id: 'books', name: '图书教材', icon: '📚', bgColor: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' },
      { id: 'clothes', name: '服饰鞋包', icon: '👕', bgColor: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)' },
      { id: 'sports', name: '运动户外', icon: '⚽', bgColor: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' },
      { id: 'daily', name: '生活用品', icon: '🏠', bgColor: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' },
      { id: 'beauty', name: '美妆护肤', icon: '💄', bgColor: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)' },
      { id: 'tickets', name: '票券卡券', icon: '🎫', bgColor: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' },
      { id: 'others', name: '其他物品', icon: '📦', bgColor: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)' }
    ],
    banners: [
      { id: 1, image: 'https://picsum.photos/750/300?random=101', title: '校园交换季', subtitle: '以物换物，让闲置流动起来' },
      { id: 2, image: 'https://picsum.photos/750/300?random=102', title: 'AI智能估价', subtitle: '不知道价格？AI帮你定价' },
      { id: 3, image: 'https://picsum.photos/750/300?random=103', title: '安全交换指南', subtitle: '平台担保，交换更放心' }
    ],
    currentBanner: 0,
    recommendItems: [],
    latestItems: [],
    loading: false,
    page: 1,
    hasMore: true,
    unreadCount: 2
  },

  onLoad() {
    this.loadHomeData();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
    
    // 每次显示页面时刷新数据
    if (app.globalData.userInfo) {
      this.loadHomeData();
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadHomeData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreItems();
    }
  },

  // 加载首页数据
  async loadHomeData() {
    try {
      // 使用真实 API 获取首页数据
      const res = await app.request({
        url: '/items/home'
      });

      if (res.success) {
        this.setData({
          recommendItems: res.data.hotItems.map(item => ({
            ...item,
            published_at: this.formatTime(item.created_at)
          })),
          latestItems: res.data.latestItems.map(item => ({
            ...item,
            published_at: this.formatTime(item.created_at)
          }))
        });
      }
    } catch (error) {
      console.error('加载首页数据失败，使用模拟数据:', error);
      // 使用模拟数据
      this.setMockData();
    }
  },

  // 模拟数据
  setMockData() {
    const mockItems = [
      {
        id: 1,
        title: 'iPhone 14 Pro Max 256G 暗夜紫',
        description: '自用一手，成色99新，电池健康95%，带原装盒子和配件',
        images: ['https://picsum.photos/400/400?random=1'],
        category_name: '数码电子',
        condition_level: '99新',
        want_description: '想换iPad Pro或者MacBook',
        user: {
          nickname: '数码达人',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
          school_name: '武汉工商学院'
        },
        published_at: '2小时前',
        view_count: 128,
        favorite_count: 15
      },
      {
        id: 2,
        title: '考研数学复习全书',
        description: '张宇考研数学，基本全新，做了几页笔记',
        images: ['https://picsum.photos/400/400?random=2'],
        category_name: '图书教材',
        condition_level: '9成新',
        want_description: '换英语词汇书或者专业课资料',
        user: {
          nickname: '考研党',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
          school_name: '武汉工商学院'
        },
        published_at: '5小时前',
        view_count: 86,
        favorite_count: 8
      },
      {
        id: 3,
        title: '耐克Air Force 1 42码',
        description: '经典纯白款，穿过几次，已清洗干净',
        images: ['https://picsum.photos/400/400?random=3'],
        category_name: '服饰鞋包',
        condition_level: '8成新',
        want_description: '换其他款式运动鞋',
        user: {
          nickname: '潮鞋控',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
          school_name: '武汉工商学院'
        },
        published_at: '1天前',
        view_count: 256,
        favorite_count: 32
      },
      {
        id: 4,
        title: '罗技G304无线鼠标',
        description: '游戏鼠标，反应灵敏，换了个新的所以出',
        images: ['https://picsum.photos/400/400?random=4'],
        category_name: '数码电子',
        condition_level: '9成新',
        want_description: '换机械键盘或者耳机',
        user: {
          nickname: '电竞少年',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
          school_name: '武汉工商学院'
        },
        published_at: '1天前',
        view_count: 92,
        favorite_count: 12
      },
      {
        id: 5,
        title: '尤尼克斯羽毛球拍',
        description: '碳纤维超轻拍，适合新手，送手胶',
        images: ['https://picsum.photos/400/400?random=5'],
        category_name: '运动户外',
        condition_level: '85成新',
        want_description: '换网球拍或者篮球',
        user: {
          nickname: '运动健将',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
          school_name: '武汉工商学院'
        },
        published_at: '2天前',
        view_count: 64,
        favorite_count: 6
      },
      {
        id: 6,
        title: '雅诗兰黛小棕瓶30ml',
        description: '专柜购买，用了1/5，肤质不合适',
        images: ['https://picsum.photos/400/400?random=6'],
        category_name: '美妆护肤',
        condition_level: '8成新',
        want_description: '换其他护肤品或者香水',
        user: {
          nickname: '美妆博主',
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
          school_name: '武汉工商学院'
        },
        published_at: '3天前',
        view_count: 178,
        favorite_count: 24
      }
    ];

    this.setData({
      recommendItems: mockItems.slice(0, 3),
      latestItems: mockItems,
      hasMore: true
    });
  },

  // 加载更多物品
  async loadMoreItems() {
    this.setData({ loading: true });

    try {
      // 使用真实 API 获取物品列表
      const res = await app.request({
        url: '/items',
        data: {
          page: this.data.page + 1,
          limit: 10,
          sort: 'newest'
        }
      });

      if (res.success) {
        const newItems = res.data.items.map(item => ({
          ...item,
          published_at: this.formatTime(item.created_at)
        }));

        this.setData({
          latestItems: [...this.data.latestItems, ...newItems],
          page: this.data.page + 1,
          hasMore: newItems.length === 10,
          loading: false
        });
      }
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载更多失败:', error);
    }
  },

  // Banner切换
  onBannerChange(e) {
    this.setData({
      currentBanner: e.detail.current
    });
  },

  // Banner点击
  onBannerTap(e) {
    const id = e.currentTarget.dataset.id;
    // 根据banner id跳转到不同页面
    if (id === 2) {
      wx.navigateTo({ url: '/pages/ai/valuation/valuation' });
    }
  },

  // 分类点击
  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/category/category?id=${id}`
    });
  },

  // 跳转到搜索
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 扫码
  scanCode() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res);
        wx.showToast({ title: '扫码成功', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '扫码失败', icon: 'none' });
      }
    });
  },

  // 跳转到消息
  goToMessages() {
    wx.navigateTo({
      url: '/pages/message/list/list'
    });
  },

  // 跳转到AI发布
  goToAIPublish() {
    wx.navigateTo({
      url: '/pages/ai/publish/publish'
    });
  },

  // 跳转到AI估价
  goToAIEvaluation() {
    wx.navigateTo({
      url: '/pages/ai/valuation/valuation'
    });
  },

  // 跳转到AI助手
  goToAIAssistant() {
    wx.navigateTo({
      url: '/pages/ai/assistant/assistant'
    });
  },

  // 跳转到分类
  goToCategory() {
    wx.switchTab({
      url: '/pages/category/category'
    });
  },

  // 跳转到物品详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/item/detail/detail?id=${id}`
    });
  },

  // 跳转到发布
  goToPublish() {
    wx.navigateTo({
      url: '/pages/item/publish/publish'
    });
  },

  // 收藏切换
  async toggleFavorite(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const item = this.data.latestItems.find(i => i.id === id) || 
                 this.data.recommendItems.find(i => i.id === id);
    
    if (!item) return;

    try {
      if (item.is_favorite) {
        // 取消收藏
        await app.request({
          url: `/favorites/${id}`,
          method: 'DELETE'
        });
        wx.showToast({ title: '已取消收藏', icon: 'success' });
      } else {
        // 添加收藏
        await app.request({
          url: '/favorites',
          method: 'POST',
          data: { item_id: id }
        });
        wx.showToast({ title: '已收藏', icon: 'success' });
      }

      // 更新本地数据
      const updateItem = (items) => items.map(i => 
        i.id === id ? { ...i, is_favorite: !i.is_favorite } : i
      );
      
      this.setData({
        latestItems: updateItem(this.data.latestItems),
        recommendItems: updateItem(this.data.recommendItems)
      });
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  // 查看更多推荐
  goToMoreRecommend() {
    wx.navigateTo({
      url: '/pages/search/search?sort=hot'
    });
  },

  // 查看更多最新
  goToMoreLatest() {
    wx.navigateTo({
      url: '/pages/search/search?sort=newest'
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }

    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }

    // 小于7天
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }

    // 显示日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
});
