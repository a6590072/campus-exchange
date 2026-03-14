const app = getApp();

Page({
  data: {
    itemId: null,
    item: {},
    matches: [],
    isFavorite: false,
    canExchange: true,
    currentImageIndex: 0
  },

  onLoad(options) {
    const itemId = options.id;
    if (!itemId) {
      wx.showToast({ title: '物品ID不存在', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ itemId });
    this.loadItemDetail(itemId);
    this.loadMatches(itemId);
    this.checkFavorite(itemId);
  },

  onShow() {
    // 增加浏览量
    if (this.data.itemId) {
      this.incrementViewCount();
    }
  },

  onShareAppMessage() {
    const { item } = this.data;
    return {
      title: `物的第二站 - ${item.title}`,
      path: `/pages/item/detail/detail?id=${item.id}`,
      imageUrl: item.cover_image
    };
  },

  // 加载物品详情
  async loadItemDetail(itemId) {
    wx.showLoading({ title: '加载中...' });

    try {
      // 使用真实 API 获取物品详情
      const res = await app.request({
        url: `/items/${itemId}`
      });

      if (res.success) {
        const item = res.data;
        this.setData({
          item: {
            ...item,
            cover_image: item.cover_image || (item.images && item.images[0]),
            published_at: this.formatTime(item.created_at),
            ai_tags: item.ai_tags || [],
            images: item.images && item.images.length > 0 ? item.images : ['/images/default/item.svg']
          },
          canExchange: item.status === 'active' && item.owner_id !== (app.globalData.userInfo && app.globalData.userInfo.id)
        });
      }
    } catch (error) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 加载匹配物品
  async loadMatches(itemId) {
    try {
      const res = await app.request({
        url: `/items/${itemId}/matches`,
        data: { limit: 5 }
      });

      if (res.success) {
        this.setData({
          matches: res.data.matches
        });
      }
    } catch (error) {
      console.error('加载匹配失败:', error);
    }
  },

  // 检查收藏状态
  async checkFavorite(itemId) {
    try {
      const res = await app.request({
        url: `/favorites/check/${itemId}`
      });

      if (res.success) {
        this.setData({ isFavorite: res.data.is_favorite });
      }
    } catch (error) {
      console.error('检查收藏失败:', error);
    }
  },

  // 切换收藏
  async toggleFavorite() {
    try {
      if (this.data.isFavorite) {
        // 取消收藏
        await app.request({
          url: `/favorites/${this.data.itemId}`,
          method: 'DELETE'
        });
        this.setData({ isFavorite: false });
        wx.showToast({ title: '已取消收藏', icon: 'success' });
      } else {
        // 添加收藏
        await app.request({
          url: '/favorites',
          method: 'POST',
          data: { item_id: this.data.itemId }
        });
        this.setData({ isFavorite: true });
        wx.showToast({ title: '收藏成功', icon: 'success' });
      }
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  // 增加浏览量
  async incrementViewCount() {
    try {
      await app.request({
        url: `/items/${this.data.itemId}/view`,
        method: 'POST'
      });
    } catch (error) {
      console.error('增加浏览量失败:', error);
    }
  },

  // 轮播图切换
  onSwiperChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const images = this.data.item.images || [this.data.item.cover_image];
    
    wx.previewImage({
      current: url,
      urls: images
    });
  },

  // 跳转到用户主页
  goToUserProfile() {
    const ownerId = this.data.item.owner_id;
    wx.navigateTo({
      url: `/pages/user/profile/profile?id=${ownerId}`
    });
  },

  // 跳转到匹配列表
  goToMatches() {
    wx.navigateTo({
      url: `/pages/exchange/match/match?itemId=${this.data.itemId}`
    });
  },

  // 跳转到匹配详情
  goToMatchDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/item/detail/detail?id=${id}`
    });
  },

  // 联系发布者
  contactOwner() {
    const item = this.data.item;
    
    if (!app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user/profile/profile' });
          }
        }
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/message/chat/chat?toUserId=${item.owner_id}&itemId=${item.id}`
    });
  },

  // 发起换物请求
  requestExchange() {
    if (!this.data.canExchange) {
      wx.showToast({ title: '该物品暂不可交换', icon: 'none' });
      return;
    }

    const item = this.data.item;

    if (!app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user/profile/profile' });
          }
        }
      });
      return;
    }

    // 跳转到换物请求页面
    wx.navigateTo({
      url: `/pages/exchange/request/request?targetItemId=${item.id}&targetUserId=${item.owner_id}`
    });
  },

  // 返回首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    // 检查日期是否有效
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diff = now - date;

    // 如果时间是未来时间，返回空字符串
    if (diff < 0) return '';

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前';
    } else if (diff < 7 * day) {
      return Math.floor(diff / day) + '天前';
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  }
});
