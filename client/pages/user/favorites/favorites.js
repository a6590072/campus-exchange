const app = getApp();

Page({
  data: {
    favorites: [],
    loading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    this.loadFavorites();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadFavorites().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreFavorites();
    }
  },

  // 加载收藏列表
  async loadFavorites() {
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: '/favorites',
        data: {
          page: 1,
          limit: 10
        }
      });

      if (res.success) {
        this.setData({
          favorites: res.data || [],
          page: 1,
          hasMore: (res.data || []).length === 10,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载收藏失败，使用模拟数据:', error);
      // 使用模拟数据
      this.setMockFavorites();
    }
  },

  // 模拟收藏数据
  setMockFavorites() {
    const mockFavorites = [
      {
        id: 1,
        item: {
          id: 101,
          title: '索尼WH-1000XM4降噪耳机',
          images: ['https://picsum.photos/400/400?random=20'],
          category_name: '数码电子',
          condition_level: '95新',
          want_description: '想换AirPods Pro或者iPad',
          user: {
            nickname: '音乐发烧友',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=20',
            school_name: '武汉工商学院'
          },
          view_count: 234,
          favorite_count: 28
        },
        created_at: '2024-01-14T10:00:00'
      },
      {
        id: 2,
        item: {
          id: 102,
          title: 'iPad mini 6 64G',
          images: ['https://picsum.photos/400/400?random=21'],
          category_name: '数码电子',
          condition_level: '99新',
          want_description: '换笔记本电脑或者相机',
          user: {
            nickname: '果粉小王',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=21',
            school_name: '武汉工商学院'
          },
          view_count: 189,
          favorite_count: 22
        },
        created_at: '2024-01-13T15:30:00'
      },
      {
        id: 3,
        item: {
          id: 103,
          title: '佳能EOS M50相机',
          images: ['https://picsum.photos/400/400?random=22'],
          category_name: '数码电子',
          condition_level: '9成新',
          want_description: '想换无人机或者游戏机',
          user: {
            nickname: '摄影爱好者',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=22',
            school_name: '武汉工商学院'
          },
          view_count: 312,
          favorite_count: 45
        },
        created_at: '2024-01-12T09:00:00'
      },
      {
        id: 4,
        item: {
          id: 104,
          title: '戴森吹风机HD08',
          images: ['https://picsum.photos/400/400?random=23'],
          category_name: '生活用品',
          condition_level: '99新',
          want_description: '换其他品牌吹风机或者护肤品',
          user: {
            nickname: '精致女孩',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=23',
            school_name: '武汉工商学院'
          },
          view_count: 156,
          favorite_count: 18
        },
        created_at: '2024-01-11T14:00:00'
      },
      {
        id: 5,
        item: {
          id: 105,
          title: '乐高哈利波特城堡',
          images: ['https://picsum.photos/400/400?random=24'],
          category_name: '其他物品',
          condition_level: '全新',
          want_description: '换其他乐高套装或者手办',
          user: {
            nickname: '乐高迷',
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=24',
            school_name: '武汉工商学院'
          },
          view_count: 98,
          favorite_count: 12
        },
        created_at: '2024-01-10T11:00:00'
      }
    ];

    this.setData({
      favorites: mockFavorites,
      page: 1,
      hasMore: false,
      loading: false
    });
  },

  // 加载更多收藏
  async loadMoreFavorites() {
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: '/favorites',
        data: {
          page: this.data.page + 1,
          limit: 10
        }
      });

      if (res.success) {
        const newFavorites = res.data || [];
        this.setData({
          favorites: [...this.data.favorites, ...newFavorites],
          page: this.data.page + 1,
          hasMore: newFavorites.length === 10,
          loading: false
        });
      }
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载更多收藏失败:', error);
    }
  },

  // 取消收藏
  async removeFavorite(e) {
    const itemId = e.currentTarget.dataset.id;
    
    try {
      await app.request({
        url: `/favorites/${itemId}`,
        method: 'DELETE'
      });

      // 从列表中移除
      const favorites = this.data.favorites.filter(f => f.item_id !== itemId);
      this.setData({ favorites });
      
      wx.showToast({ title: '已取消收藏', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 跳转到详情
  goToDetail(e) {
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
