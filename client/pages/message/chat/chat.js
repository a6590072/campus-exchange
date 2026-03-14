const app = getApp();

Page({
  data: {
    exchangeId: null,
    messages: [],
    inputMessage: '',
    loading: false,
    page: 1,
    hasMore: true,
    scrollToMessage: ''
  },

  onLoad(options) {
    const { exchangeId } = options;
    if (!exchangeId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ exchangeId });
    this.loadMessages();
    // 标记消息为已读
    this.markAsRead();
  },

  onShow() {
    if (this.data.exchangeId) {
      this.loadMessages();
    }
  },

  // 加载消息列表
  async loadMessages() {
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: `/messages/exchange/${this.data.exchangeId}`,
        data: {
          page: this.data.page,
          limit: 20
        }
      });

      if (res.success) {
        const messages = (res.data || []).map(msg => ({
          id: msg.id,
          content: msg.content,
          isSelf: msg.sender_id === (app.globalData.userInfo && app.globalData.userInfo.id),
          senderNickname: msg.sender_nickname,
          senderAvatar: msg.sender_avatar,
          createdAt: msg.created_at
        }));

        this.setData({
          messages: this.data.page === 1 ? messages : [...messages, ...this.data.messages],
          loading: false,
          scrollToMessage: messages.length > 0 ? `msg-${messages[messages.length - 1].id}` : ''
        });
      }
    } catch (error) {
      this.setData({ loading: false });
      console.error('加载消息失败:', error);
    }
  },

  // 加载更多消息
  async loadMoreMessages() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ page: this.data.page + 1 });
    await this.loadMessages();
  },

  // 发送消息
  async sendMessage() {
    const content = this.data.inputMessage.trim();
    if (!content) return;

    try {
      const res = await app.request({
        url: '/messages',
        method: 'POST',
        data: {
          exchange_id: parseInt(this.data.exchangeId),
          content: content,
          content_type: 'text'
        }
      });

      if (res.success) {
        // 清空输入框
        this.setData({ inputMessage: '' });
        // 重新加载消息
        this.setData({ page: 1 });
        await this.loadMessages();
      }
    } catch (error) {
      wx.showToast({ title: error.message || '发送失败', icon: 'none' });
    }
  },

  // 输入消息
  onInputMessage(e) {
    this.setData({ inputMessage: e.detail.value });
  },

  // 标记消息为已读
  async markAsRead() {
    try {
      await app.request({
        url: `/messages/exchange/${this.data.exchangeId}/read`,
        method: 'POST'
      });
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
