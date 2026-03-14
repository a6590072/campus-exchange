const app = getApp();

Page({
  data: {
    activeTab: 'received', // received: 收到的请求, sent: 发出的请求
    exchanges: [],
    loading: false,
    page: 1,
    hasMore: true,
    stats: {
      pending: 0,
      accepted: 0,
      completed: 0
    }
  },

  onLoad() {
    this.loadExchanges();
    this.loadStats();
  },

  onShow() {
    this.loadExchanges();
    this.loadStats();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    Promise.all([this.loadExchanges(), this.loadStats()]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreExchanges();
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      exchanges: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadExchanges();
    });
  },

  // 加载交换列表
  async loadExchanges() {
    this.setData({ loading: true });

    const url = this.data.activeTab === 'received' 
      ? '/exchanges/received' 
      : '/exchanges/sent';

    try {
      const res = await app.request({
        url,
        data: {
          page: 1,
          limit: 10
        }
      });

      if (res.success) {
        this.setData({
          exchanges: res.data.exchanges || [],
          page: 1,
          hasMore: (res.data.exchanges || []).length === 10,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载交换列表失败，使用模拟数据:', error);
      // 使用模拟数据
      this.setMockExchanges();
    }
  },

  // 模拟交换数据
  setMockExchanges() {
    const mockExchanges = {
      received: [
        {
          id: 1,
          requester: {
            id: 101,
            nickname: '数码达人',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
          },
          myItem: {
            id: 1,
            title: 'iPhone 14 Pro Max',
            image: 'https://picsum.photos/200/200?random=1'
          },
          offerItem: {
            id: 10,
            title: 'iPad Pro 11寸',
            image: 'https://picsum.photos/200/200?random=10'
          },
          status: 'pending',
          statusText: '待处理',
          message: '你好，我想用iPad Pro换你的iPhone，可以补差价',
          created_at: '2024-01-15T10:30:00'
        },
        {
          id: 2,
          requester: {
            id: 102,
            nickname: '考研党',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
          },
          myItem: {
            id: 2,
            title: '考研数学复习全书',
            image: 'https://picsum.photos/200/200?random=2'
          },
          offerItem: {
            id: 11,
            title: '考研英语词汇书',
            image: 'https://picsum.photos/200/200?random=11'
          },
          status: 'accepted',
          statusText: '已同意',
          message: '好的，我们交换吧',
          created_at: '2024-01-14T15:20:00'
        }
      ],
      sent: [
        {
          id: 3,
          receiver: {
            id: 103,
            nickname: '潮鞋控',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
          },
          myItem: {
            id: 5,
            title: 'AirPods Pro 2代',
            image: 'https://picsum.photos/200/200?random=7'
          },
          targetItem: {
            id: 12,
            title: '耐克Air Force 1',
            image: 'https://picsum.photos/200/200?random=3'
          },
          status: 'pending',
          statusText: '等待对方确认',
          message: '你好，我想用AirPods换你的鞋子',
          created_at: '2024-01-15T09:00:00'
        },
        {
          id: 4,
          receiver: {
            id: 104,
            nickname: '电竞少年',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
          },
          myItem: {
            id: 6,
            title: 'Kindle Paperwhite',
            image: 'https://picsum.photos/200/200?random=8'
          },
          targetItem: {
            id: 13,
            title: '罗技G304鼠标',
            image: 'https://picsum.photos/200/200?random=4'
          },
          status: 'completed',
          statusText: '交换完成',
          message: '交换成功，谢谢！',
          created_at: '2024-01-10T14:00:00'
        }
      ]
    };

    const currentTab = this.data.activeTab;
    this.setData({
      exchanges: mockExchanges[currentTab] || [],
      page: 1,
      hasMore: false,
      loading: false
    });
  },

  // 加载更多交换
  async loadMoreExchanges() {
    this.setData({ loading: true });

    const url = this.data.activeTab === 'received' 
      ? '/exchanges/received' 
      : '/exchanges/sent';

    try {
      const res = await app.request({
        url,
        data: {
          page: this.data.page + 1,
          limit: 10
        }
      });

      if (res.success) {
        const newExchanges = res.data.exchanges || [];
        this.setData({
          exchanges: [...this.data.exchanges, ...newExchanges],
          page: this.data.page + 1,
          hasMore: newExchanges.length === 10,
          loading: false
        });
      }
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载更多交换失败:', error);
    }
  },

  // 加载统计
  async loadStats() {
    try {
      const res = await app.request({
        url: '/exchanges/stats'
      });

      if (res.success) {
        this.setData({ stats: res.data });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },

  // 接受交换
  async acceptExchange(e) {
    const exchangeId = e.currentTarget.dataset.id;
    
    try {
      const res = await app.request({
        url: `/exchanges/${exchangeId}/accept`,
        method: 'POST'
      });

      if (res.success) {
        wx.showToast({ title: '已接受交换', icon: 'success' });
        this.loadExchanges();
        this.loadStats();
      }
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  // 拒绝交换
  async rejectExchange(e) {
    const exchangeId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个交换请求吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/exchanges/${exchangeId}/reject`,
              method: 'POST'
            });

            if (result.success) {
              wx.showToast({ title: '已拒绝交换', icon: 'success' });
              this.loadExchanges();
              this.loadStats();
            }
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 完成交换
  async completeExchange(e) {
    const exchangeId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认完成',
      content: '确认双方已完成物品交换？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/exchanges/${exchangeId}/complete`,
              method: 'POST'
            });

            if (result.success) {
              wx.showToast({ title: '交换已完成', icon: 'success' });
              this.loadExchanges();
              this.loadStats();
            }
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 取消交换
  async cancelExchange(e) {
    const exchangeId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个交换请求吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/exchanges/${exchangeId}/cancel`,
              method: 'POST'
            });

            if (result.success) {
              wx.showToast({ title: '已取消交换', icon: 'success' });
              this.loadExchanges();
              this.loadStats();
            }
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 跳转到聊天
  goToChat(e) {
    const exchangeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/message/chat/chat?exchangeId=${exchangeId}`
    });
  },

  // 跳转到物品详情
  goToItemDetail(e) {
    const itemId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/item/detail/detail?id=${itemId}`
    });
  },

  // 返回首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});
