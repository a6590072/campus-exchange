const app = getApp();

Page({
  data: {
    targetItemId: null,
    targetItem: null,
    myItems: [],
    selectedItemId: null,
    message: '',
    cashOffer: '',
    loading: false,
    submitting: false
  },

  onLoad(options) {
    const { targetItemId } = options;
    if (!targetItemId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ targetItemId });
    this.loadTargetItem(targetItemId);
    this.loadMyItems();
  },

  // 加载目标物品信息
  async loadTargetItem(itemId) {
    try {
      const res = await app.request({
        url: `/items/${itemId}`
      });

      if (res.success) {
        this.setData({ targetItem: res.data });
      }
    } catch (error) {
      console.error('加载物品信息失败:', error);
    }
  },

  // 加载我的物品列表
  async loadMyItems() {
    try {
      const res = await app.request({
        url: '/items/my',
        data: { status: 'active' }
      });

      if (res.success) {
        this.setData({ myItems: res.data.items || [] });
      }
    } catch (error) {
      console.error('加载我的物品失败:', error);
    }
  },

  // 选择我的物品
  selectMyItem(e) {
    const itemId = e.currentTarget.dataset.id;
    this.setData({
      selectedItemId: this.data.selectedItemId === itemId ? null : itemId
    });
  },

  // 输入留言
  onMessageInput(e) {
    this.setData({ message: e.detail.value });
  },

  // 输入补差价金额
  onCashInput(e) {
    this.setData({ cashOffer: e.detail.value });
  },

  // 提交交换请求
  async submitRequest() {
    const { targetItemId, selectedItemId, message, cashOffer, targetItem } = this.data;

    if (!targetItem) {
      wx.showToast({ title: '物品信息加载中', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const res = await app.request({
        url: '/exchanges',
        method: 'POST',
        data: {
          target_item_id: parseInt(targetItemId),
          requester_item_id: selectedItemId ? parseInt(selectedItemId) : null,
          message: message,
          cash_offer: cashOffer ? parseFloat(cashOffer) : 0
        }
      });

      if (res.success) {
        wx.showToast({ title: '交换请求已发送', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      wx.showToast({ title: error.message || '发送失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 跳转到发布页面
  goToPublish() {
    wx.switchTab({
      url: '/pages/item/publish/publish'
    });
  }
});
