const app = getApp();

Page({
  data: {
    inputText: '',
    isParsing: false,
    parsedItem: null,
    showResult: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: 'AI智能发布'
    });
  },

  // 输入框变化
  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 示例快速填充
  fillExample(e) {
    const example = e.currentTarget.dataset.example;
    this.setData({
      inputText: example
    });
  },

  // AI解析物品
  async parseItem() {
    const { inputText } = this.data;
    
    if (!inputText.trim()) {
      wx.showToast({
        title: '请先描述你的物品',
        icon: 'none'
      });
      return;
    }

    this.setData({ isParsing: true });

    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${app.globalData.apiBaseUrl}/ai/parse-item`,
          method: 'POST',
          data: { text: inputText },
          success: resolve,
          fail: reject
        });
      });

      if (res.data.success) {
        this.setData({
          parsedItem: res.data.data,
          showResult: true
        });
      } else {
        wx.showToast({
          title: '解析失败，请重试',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('AI解析失败:', error);
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    } finally {
      this.setData({ isParsing: false });
    }
  },

  // 使用解析结果去发布
  goToPublish() {
    const { parsedItem } = this.data;
    
    // 将解析结果存储到全局或本地存储
    wx.setStorageSync('aiParsedItem', parsedItem);
    
    wx.navigateTo({
      url: '/pages/item/publish/publish?from=ai'
    });
  },

  // 重新输入
  reset() {
    this.setData({
      inputText: '',
      parsedItem: null,
      showResult: false
    });
  }
});
