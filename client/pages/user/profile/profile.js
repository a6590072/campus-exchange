const app = getApp();

Page({
  data: {
    userInfo: {},
    stats: {
      itemCount: 0,
      exchangeCount: 0,
      favoriteCount: 0,
      creditScore: 100
    },
    isLoggedIn: false,
    statusBarHeight: 20
  },

  onLoad() {
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
    this.checkLoginStatus();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4
      });
    }
    
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = !!app.globalData.token && !!userInfo;
    
    // 如果有用户信息，同时更新 stats
    if (isLoggedIn && userInfo) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true,
        stats: {
          itemCount: userInfo.stats?.item_count || 0,
          exchangeCount: userInfo.stats?.exchange_count || 0,
          favoriteCount: userInfo.stats?.favorite_count || 0,
          creditScore: userInfo.credit_score || 100
        }
      });
    } else {
      this.setData({
        userInfo: {},
        isLoggedIn: false,
        stats: {
          itemCount: 0,
          exchangeCount: 0,
          favoriteCount: 0,
          creditScore: 100
        }
      });
    }
  },

  // 加载用户统计
  async loadUserStats() {
    try {
      // 使用真实 API 获取用户信息
      const res = await app.request({
        url: '/auth/me'
      });

      if (res.success) {
        const user = res.data;
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            nickname: user.nickname,
            avatar_url: user.avatar_url,
            school_name: user.school_name,
            is_verified: user.is_verified
          },
          stats: {
            itemCount: user.stats?.item_count || 0,
            exchangeCount: user.stats?.exchange_count || 0,
            favoriteCount: user.stats?.favorite_count || 0,
            creditScore: user.credit_score || 100
          }
        });
        // 更新全局数据
        app.globalData.userInfo = user;
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },

  // 微信登录（暂时模拟登录）
  async wechatLogin() {
    wx.showLoading({ title: '登录中...' });

    try {
      // 模拟登录数据
      const mockUser = {
        id: 1,
        nickname: '校园达人',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        school_name: '武汉工商学院',
        is_verified: true,
        introduction: '让闲置物品流动起来，开启校园交换之旅',
        credit_score: 100,
        stats: {
          item_count: 12,
          exchange_count: 8,
          favorite_count: 25
        }
      };

      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 800));

      // 更新全局数据
      app.globalData.userInfo = mockUser;
      app.globalData.token = 'mock_token_' + Date.now();

      // 更新页面数据
      this.setData({
        userInfo: mockUser,
        isLoggedIn: true,
        stats: {
          itemCount: mockUser.stats.item_count,
          exchangeCount: mockUser.stats.exchange_count,
          favoriteCount: mockUser.stats.favorite_count,
          creditScore: mockUser.credit_score
        }
      });

      console.log('登录成功，数据:', this.data);

      wx.showToast({ title: '登录成功', icon: 'success' });
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({ title: '登录失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginStatus();
          this.setData({
            userInfo: {},
            isLoggedIn: false,
            stats: {
              itemCount: 0,
              exchangeCount: 0,
              favoriteCount: 0,
              creditScore: 100
            }
          });
          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  // 跳转到我的发布
  goToMyItems() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/user/my-items/my-items' });
  },

  // 跳转到换物记录
  goToMyExchanges() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/user/my-exchanges/my-exchanges' });
  },

  // 跳转到收藏
  goToFavorites() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/user/favorites/favorites' });
  },

  // 跳转到AI估值
  goToValuation() {
    wx.navigateTo({ url: '/pages/ai/valuation/valuation' });
  },

  // 跳转到AI发布
  goToAIPublish() {
    wx.navigateTo({ url: '/pages/ai/publish/publish' });
  },

  // 跳转到AI助手
  goToAIAssistant() {
    wx.navigateTo({ url: '/pages/ai/assistant/assistant' });
  },

  // 跳转到智能匹配
  goToSmartMatch() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 跳转到设置
  goToSettings() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/user/settings/settings' });
  },

  // 跳转到认证
  goToVerification() {
    if (!this.checkLogin()) return;
    wx.navigateTo({ url: '/pages/user/verification/verification' });
  },

  // 联系客服
  contactSupport() {
    wx.showModal({
      title: '联系客服',
      content: '客服微信号: huanhuan-campus',
      showCancel: false
    });
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于物的第二站',
      content: '物的第二站是一款专注于大学生物品交换的平台，让闲置物品流动起来，实现资源再利用。',
      showCancel: false
    });
  },

  // 检查登录
  checkLogin() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            this.wechatLogin();
          }
        }
      });
      return false;
    }
    return true;
  }
});
