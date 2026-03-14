Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        icon: "icon-home"
      },
      {
        pagePath: "/pages/category/category",
        text: "分类",
        icon: "icon-category"
      },
      {
        pagePath: "/pages/item/publish/publish",
        text: "发布",
        icon: "icon-publish"
      },
      {
        pagePath: "/pages/message/list/list",
        text: "消息",
        icon: "icon-message"
      },
      {
        pagePath: "/pages/user/profile/profile",
        text: "我的",
        icon: "icon-profile"
      }
    ]
  },
  
  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const path = this.data.list[index].pagePath;
      
      // 添加触觉反馈
      if (wx.vibrateShort) {
        wx.vibrateShort({ type: 'light' });
      }
      
      wx.switchTab({
        url: path
      });
    }
  }
});