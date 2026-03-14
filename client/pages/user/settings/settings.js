const app = getApp();

Page({
  data: {},

  goToProfile() {
    wx.navigateTo({
      url: '/pages/user/profile/profile'
    });
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage();
          wx.showToast({ title: '清除成功', icon: 'success' });
        }
      }
    });
  },

  about() {
    wx.showModal({
      title: '关于物的第二站',
      content: '物的第二站 v1.0.0\n专注于大学生物品交换的平台',
      showCancel: false
    });
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.globalData.token = null;
          app.globalData.userInfo = null;
          wx.removeStorageSync('token');
          wx.showToast({ title: '已退出', icon: 'success' });
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  }
});
