const app = getApp();

Page({
  data: {
    categories: [
      { id: 1, name: '手机数码', icon: '📱', bgColor: '#EEF2FF', count: 128 },
      { id: 2, name: '电脑办公', icon: '💻', bgColor: '#F0FDF4', count: 86 },
      { id: 3, name: '图书教材', icon: '📚', bgColor: '#FDF2F8', count: 256 },
      { id: 4, name: '服饰鞋包', icon: '👕', bgColor: '#FEF3C7', count: 192 },
      { id: 5, name: '运动户外', icon: '⚽', bgColor: '#ECFDF5', count: 64 },
      { id: 6, name: '生活用品', icon: '🏠', bgColor: '#FCE7F3', count: 145 },
      { id: 7, name: '美妆护肤', icon: '💄', bgColor: '#DBEAFE', count: 78 },
      { id: 8, name: '票券卡券', icon: '🎫', bgColor: '#FEF9C3', count: 32 },
      { id: 9, name: '其他物品', icon: '📦', bgColor: '#F3F4F6', count: 45 }
    ]
  },

  onLoad() {
    this.loadCategoryCounts();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
  },

  // 加载分类数量
  async loadCategoryCounts() {
    try {
      const res = await app.request({
        url: '/categories/counts'
      });

      if (res.success) {
        // 更新分类数量
        const categories = this.data.categories.map(cat => {
          const count = res.data.counts.find(c => c.id === cat.id);
          return { ...cat, count: count?.count || 0 };
        });
        this.setData({ categories });
      }
    } catch (error) {
      console.error('加载分类数量失败:', error);
    }
  },

  // 跳转到搜索
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 跳转到分类物品列表
  goToCategoryItems(e) {
    const id = e.currentTarget.dataset.id;
    const category = this.data.categories.find(c => c.id === id);
    
    wx.navigateTo({
      url: `/pages/search/search?categoryId=${id}&categoryName=${category.name}`
    });
  }
});
