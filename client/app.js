App({
  globalData: {
    userInfo: null,
    token: null,
    // 生产环境使用 Railway 云端地址
    // 本地开发使用: http://localhost:3001/api/v1
    // 局域网测试使用: http://192.168.1.27:3001/api/v1
    apiBaseUrl: 'https://campus-exchange-production.up.railway.app/api/v1',
    systemInfo: null
  },

  onLaunch() {
    // 获取系统信息（使用异步 API 替代已废弃的同步 API）
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });
    
    // 检查登录状态
    this.checkLoginStatus();
    
    console.log('物的第二站小程序启动');
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.getUserInfo();
    }
  },

  // 获取用户信息
  getUserInfo() {
    const token = this.globalData.token;
    if (!token) return;

    wx.request({
      url: `${this.globalData.apiBaseUrl}/auth/me`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.data.success) {
          this.globalData.userInfo = res.data.data.user;
        } else {
          // token失效，清除登录状态
          this.clearLoginStatus();
        }
      },
      fail: () => {
        this.clearLoginStatus();
      }
    });
  },

  // 微信登录
  wechatLogin(userInfo = null) {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: `${this.globalData.apiBaseUrl}/auth/wechat-login`,
              method: 'POST',
              data: {
                code: res.code,
                userInfo: userInfo
              },
              success: (loginRes) => {
                if (loginRes.data.success) {
                  const { token, user } = loginRes.data.data;
                  this.globalData.token = token;
                  this.globalData.userInfo = user;
                  wx.setStorageSync('token', token);
                  resolve(loginRes.data.data);
                } else {
                  reject(new Error(loginRes.data.message));
                }
              },
              fail: reject
            });
          } else {
            reject(new Error('获取微信code失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 清除登录状态
  clearLoginStatus() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
  },

  // 通用请求封装
  request(options) {
    const token = this.globalData.token;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: options.url.startsWith('http') ? options.url : `${this.globalData.apiBaseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...(options.header || {})
        },
        success: (res) => {
          if (res.statusCode === 401) {
            // token过期，清除登录状态并跳转到我的页面
            this.clearLoginStatus();
            wx.switchTab({ url: '/pages/user/profile/profile' });
            reject(new Error('登录已过期'));
          } else if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 上传图片
  uploadImage(filePath) {
    const token = this.globalData.token;
    
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${this.globalData.apiBaseUrl}/upload/image`,
        filePath: filePath,
        name: 'image',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          if (data.success) {
            resolve(data.data.url);
          } else {
            reject(new Error(data.message));
          }
        },
        fail: reject
      });
    });
  },

  // 显示提示
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    });
  },

  // 显示加载
  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  // 隐藏加载
  hideLoading() {
    wx.hideLoading();
  },

  // 显示确认框
  showModal(title, content) {
    return new Promise((resolve) => {
      wx.showModal({
        title,
        content,
        success: (res) => {
          resolve(res.confirm);
        }
      });
    });
  }
});
