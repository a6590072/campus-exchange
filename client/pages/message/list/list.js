const app = getApp();

Page({
  data: {
    conversations: [],
    loading: false
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      });
    }
    
    if (app.globalData.token) {
      this.loadConversations();
    }
  },

  onPullDownRefresh() {
    this.loadConversations().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查登录
  checkLogin() {
    if (!app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user/profile/profile' });
          } else {
            wx.switchTab({ url: '/pages/index/index' });
          }
        }
      });
      return false;
    }
    return true;
  },

  // 加载会话列表
  async loadConversations() {
    this.setData({ loading: true });

    try {
      // 使用真实 API 获取会话列表
      const res = await app.request({
        url: '/messages/conversations'
      });

      if (res.success) {
        const conversations = (res.data || []).map((conv) => ({
          id: conv.exchange_id,
          otherUser: {
            id: conv.last_message.sender_id,
            nickname: conv.last_message.sender_nickname,
            avatar: conv.last_message.sender_avatar
          },
          lastMessage: conv.last_message.content,
          lastMessageTime: this.formatTime(conv.last_message.created_at),
          unreadCount: conv.last_message.is_read ? 0 : 1,
          exchangeStatus: conv.exchange_status,
          relatedItem: null
        }));

        this.setData({
          conversations: conversations,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载会话失败，使用模拟数据:', error);
      // 使用模拟数据
      this.setMockConversations();
    }
  },

  // 模拟会话数据
  setMockConversations() {
    const mockConversations = [
      {
        id: 1,
        otherUser: {
          id: 101,
          nickname: '数码达人',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
        },
        lastMessage: '好的，那我们明天下午在图书馆门口见？',
        lastMessageTime: '10分钟前',
        unreadCount: 2,
        exchangeStatus: 'negotiating',
        relatedItem: {
          title: 'iPhone 14 Pro Max',
          image: 'https://picsum.photos/200/200?random=1'
        }
      },
      {
        id: 2,
        otherUser: {
          id: 102,
          nickname: '考研党',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
        },
        lastMessage: '书还在吗？我想用英语词汇书跟你换',
        lastMessageTime: '2小时前',
        unreadCount: 0,
        exchangeStatus: 'pending',
        relatedItem: {
          title: '考研数学复习全书',
          image: 'https://picsum.photos/200/200?random=2'
        }
      },
      {
        id: 3,
        otherUser: {
          id: 103,
          nickname: '潮鞋控',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
        },
        lastMessage: '鞋子我已经清洗过了，你看什么时候方便？',
        lastMessageTime: '昨天',
        unreadCount: 0,
        exchangeStatus: 'confirmed',
        relatedItem: {
          title: '耐克Air Force 1',
          image: 'https://picsum.photos/200/200?random=3'
        }
      },
      {
        id: 4,
        otherUser: {
          id: 104,
          nickname: '电竞少年',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
        },
        lastMessage: '感谢交换！鼠标很好用',
        lastMessageTime: '3天前',
        unreadCount: 0,
        exchangeStatus: 'completed',
        relatedItem: {
          title: '罗技G304鼠标',
          image: 'https://picsum.photos/200/200?random=4'
        }
      }
    ];

    this.setData({
      conversations: mockConversations,
      loading: false
    });
  },

  // 跳转到聊天
  goToChat(e) {
    const exchangeId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/message/chat/chat?exchangeId=${exchangeId}`
    });
  },

  // 删除会话
  deleteConversation(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条会话吗？',
      success: (res) => {
        if (res.confirm) {
          const conversations = this.data.conversations.filter(c => c.id !== id);
          this.setData({ conversations });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  // 跳转到首页
  goToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // 小于1小时
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return minutes < 1 ? '刚刚' : `${minutes}分钟前`;
    }
    
    // 小于24小时
    if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    }
    
    // 小于7天
    if (diff < 604800000) {
      return `${Math.floor(diff / 86400000)}天前`;
    }
    
    // 显示日期
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
});
