const app = getApp();

Page({
  data: {
    activeTab: 'selling',
    activeTabText: '出售中',
    items: [],
    loading: false,
    counts: {
      selling: 0,
      exchanged: 0,
      offline: 0
    }
  },

  onLoad() {
    this.loadItems();
  },

  onShow() {
    this.loadItems();
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    const tabTextMap = {
      selling: '出售中',
      exchanged: '已换出',
      offline: '已下架'
    };
    
    this.setData({
      activeTab: tab,
      activeTabText: tabTextMap[tab]
    }, () => {
      this.loadItems();
    });
  },

  // 加载物品列表
  async loadItems() {
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: '/items/my',
        data: {
          status: this.data.activeTab
        }
      });

      if (res.success) {
        const items = res.data.items.map(item => ({
          ...item,
          statusText: this.getStatusText(item.status)
        }));

        this.setData({
          items,
          counts: res.data.counts || this.data.counts,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载物品失败，使用模拟数据:', error);
      // 使用模拟数据
      this.setMockItems();
    }
  },

  // 模拟物品数据
  setMockItems() {
    const mockItems = {
      selling: [
        {
          id: 1,
          title: 'iPhone 14 Pro Max 256G',
          images: ['https://picsum.photos/400/400?random=1'],
          category_name: '数码电子',
          condition_level: '99新',
          want_description: '想换iPad Pro',
          view_count: 128,
          favorite_count: 15,
          status: 'active',
          statusText: '出售中',
          created_at: '2024-01-15'
        },
        {
          id: 2,
          title: '考研数学复习全书',
          images: ['https://picsum.photos/400/400?random=2'],
          category_name: '图书教材',
          condition_level: '9成新',
          want_description: '换英语词汇书',
          view_count: 86,
          favorite_count: 8,
          status: 'active',
          statusText: '出售中',
          created_at: '2024-01-14'
        },
        {
          id: 3,
          title: '罗技G304无线鼠标',
          images: ['https://picsum.photos/400/400?random=4'],
          category_name: '数码电子',
          condition_level: '9成新',
          want_description: '换机械键盘',
          view_count: 92,
          favorite_count: 12,
          status: 'active',
          statusText: '出售中',
          created_at: '2024-01-13'
        }
      ],
      exchanged: [
        {
          id: 4,
          title: 'AirPods Pro 2代',
          images: ['https://picsum.photos/400/400?random=7'],
          category_name: '数码电子',
          condition_level: '95新',
          want_description: '已换出',
          view_count: 256,
          favorite_count: 32,
          status: 'exchanged',
          statusText: '已换出',
          created_at: '2024-01-10',
          exchanged_with: '索尼WH-1000XM4'
        },
        {
          id: 5,
          title: 'Kindle Paperwhite 5',
          images: ['https://picsum.photos/400/400?random=8'],
          category_name: '数码电子',
          condition_level: '9成新',
          want_description: '已换出',
          view_count: 178,
          favorite_count: 24,
          status: 'exchanged',
          statusText: '已换出',
          created_at: '2024-01-08',
          exchanged_with: 'iPad mini 6'
        }
      ],
      offline: [
        {
          id: 6,
          title: '任天堂Switch游戏机',
          images: ['https://picsum.photos/400/400?random=9'],
          category_name: '数码电子',
          condition_level: '85新',
          want_description: '暂时不换了',
          view_count: 312,
          favorite_count: 45,
          status: 'offline',
          statusText: '已下架',
          created_at: '2024-01-05'
        }
      ]
    };

    const currentTab = this.data.activeTab;
    this.setData({
      items: mockItems[currentTab] || [],
      counts: {
        selling: 3,
        exchanged: 2,
        offline: 1
      },
      loading: false
    });
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      active: '出售中',
      exchanged: '已换出',
      offline: '已下架'
    };
    return statusMap[status] || status;
  },

  // 跳转到详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/item/detail/detail?id=${id}`
    });
  },

  // 编辑物品
  editItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/item/edit/edit?id=${id}`
    });
  },

  // 删除物品
  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个物品吗？删除后无法恢复',
      confirmColor: '#EF4444',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/items/${id}`,
              method: 'DELETE'
            });

            if (result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadItems();
            }
          } catch (error) {
            console.error('删除失败:', error);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 去发布
  goToPublish() {
    wx.switchTab({
      url: '/pages/item/publish/publish'
    });
  }
});
