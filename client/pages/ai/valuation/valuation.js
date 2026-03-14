const app = getApp();

Page({
  data: {
    itemName: '',
    itemDesc: '',
    category: '',
    condition: '',
    isEvaluating: false,
    evaluationResult: null,
    showResult: false,
    categories: ['电子产品', '书籍教材', '生活用品', '服装鞋帽', '运动户外', '美妆护肤', '其他'],
    conditions: ['全新', '99新', '95新', '9成新', '8成新', '7成新及以下']
  },

  onLoad(options) {
    // 如果有传入物品信息，自动填充
    if (options.name) {
      this.setData({ itemName: options.name });
    }
    if (options.desc) {
      this.setData({ itemDesc: options.desc });
    }
  },

  onNameInput(e) {
    this.setData({ itemName: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ itemDesc: e.detail.value });
  },

  selectCategory(e) {
    this.setData({ category: e.currentTarget.dataset.value });
  },

  selectCondition(e) {
    this.setData({ condition: e.currentTarget.dataset.value });
  },

  async startEvaluation() {
    const { itemName, itemDesc, category, condition } = this.data;

    if (!itemName || !itemDesc) {
      wx.showToast({
        title: '请填写物品名称和描述',
        icon: 'none'
      });
      return;
    }

    this.setData({ isEvaluating: true });

    try {
      // 使用真实 API 进行 AI 估值
      const res = await app.request({
        url: '/ai/evaluate/preview',
        method: 'POST',
        data: {
          title: itemName,
          description: itemDesc,
          category: category || '其他',
          condition_level: condition || '9成新'
        }
      });

      if (res.success) {
        this.setData({
          evaluationResult: {
            estimatedPrice: {
              min: res.data.estimated_value_min,
              max: res.data.estimated_value_max,
              suggested: res.data.estimated_value_ai
            },
            description: res.data.ai_description,
            tags: res.data.ai_tags,
            features: res.data.ai_features
          },
          showResult: true
        });
      } else {
        wx.showToast({
          title: res.message || '估价失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('AI估价失败:', error);
      wx.showToast({
        title: error.message || '网络错误',
        icon: 'none'
      });
    } finally {
      this.setData({ isEvaluating: false });
    }
  },

  goBack() {
    this.setData({
      showResult: false,
      evaluationResult: null
    });
  },

  usePrice() {
    const { evaluationResult, itemName, itemDesc } = this.data;
    const suggestedPrice = evaluationResult.estimatedPrice.suggested;
    
    // 返回上一页并传递价格
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      prevPage.setData({
        'formData.suggested_price': suggestedPrice,
        'formData.title': itemName,
        'formData.description': itemDesc
      });
    }
    
    wx.navigateBack();
  }
});
