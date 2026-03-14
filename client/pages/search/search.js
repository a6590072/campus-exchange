const app = getApp();

Page({
  data: {
    keyword: '',
    placeholder: '搜索物品、品牌、型号...',
    history: [],
    hotKeywords: ['iPhone', 'iPad', '教材', '自行车', '耳机', '键盘', '鼠标', '显示器', '台灯', '充电宝'],
    items: [],
    loading: false,
    currentFilter: 'all',
    categoryId: null,
    categoryName: ''
  },

  onLoad(options) {
    // 加载搜索历史
    this.loadSearchHistory();
    
    // 如果有分类参数
    if (options.categoryId) {
      this.setData({
        categoryId: options.categoryId,
        categoryName: options.categoryName,
        placeholder: `搜索${options.categoryName}...`
      });
    }
  },

  // 加载搜索历史
  loadSearchHistory() {
    const history = wx.getStorageSync('searchHistory') || [];
    this.setData({ history });
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword.trim()) return;
    
    let history = wx.getStorageSync('searchHistory') || [];
    history = history.filter(h => h !== keyword);
    history.unshift(keyword);
    history = history.slice(0, 10);
    
    wx.setStorageSync('searchHistory', history);
    this.setData({ history });
  },

  // 清空搜索历史
  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory');
          this.setData({ history: [] });
        }
      }
    });
  },

  // 输入处理
  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 清空搜索
  clearSearch() {
    this.setData({ keyword: '', items: [] });
  },

  // 执行搜索
  async doSearch() {
    const { keyword, categoryId } = this.data;
    
    if (!keyword.trim() && !categoryId) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    this.saveSearchHistory(keyword);
    this.setData({ loading: true });

    try {
      const params = {
        keyword: keyword.trim(),
        category_id: categoryId,
        sort: this.data.currentFilter
      };

      const res = await app.request({
        url: '/items',
        data: params
      });

      if (res.success) {
        this.setData({
          items: res.data.items || [],
          loading: false
        });
      }
    } catch (error) {
      this.setData({ loading: false });
      console.error('搜索失败:', error);
    }
  },

  // 从历史搜索
  searchFromHistory(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword }, () => {
      this.doSearch();
    });
  },

  // 设置筛选
  setFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ currentFilter: filter }, () => {
      if (this.data.keyword || this.data.categoryId) {
        this.doSearch();
      }
    });
  },

  // 跳转到详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/item/detail/detail?id=${id}`
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});
