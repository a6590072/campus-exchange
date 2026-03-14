const app = getApp();

Page({
  data: {
    images: [],
    categories: [
      { id: 1, name: '手机数码', icon: '📱' },
      { id: 2, name: '电脑办公', icon: '💻' },
      { id: 3, name: '图书教材', icon: '📚' },
      { id: 4, name: '服饰鞋包', icon: '👕' },
      { id: 5, name: '运动户外', icon: '⚽' },
      { id: 6, name: '生活用品', icon: '🏠' },
      { id: 7, name: '美妆护肤', icon: '💄' },
      { id: 8, name: '票券卡券', icon: '🎫' },
      { id: 9, name: '其他物品', icon: '📦' }
    ],
    conditions: [
      { value: 'brand_new', label: '全新' },
      { value: 'like_new', label: '99新' },
      { value: 'excellent', label: '9成新' },
      { value: 'good', label: '8成新' },
      { value: 'fair', label: '7成新及以下' }
    ],
    categoryIndex: -1,
    conditionIndex: -1,
    form: {
      title: '',
      categoryId: null,
      categoryName: '',
      conditionLevel: '',
      conditionDescription: '',
      originalPrice: '',
      exchangeType: 'any',
      wantDescription: '',
      cashAcceptable: true,
      cashMin: '',
      cashMax: '',
      locationName: ''
    },
    aiEvaluation: null,
    isAiLoading: false,
    canSubmit: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布物品',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/user/profile/profile' });
          } else {
            wx.navigateBack();
          }
        }
      });
    }
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  // 选择图片
  chooseImage() {
    const remainCount = 9 - this.data.images.length;
    
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          images: [...this.data.images, ...newImages]
        });
        this.checkCanSubmit();
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
    this.checkCanSubmit();
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      'form.title': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 分类选择
  onCategoryChange(e) {
    const index = e.detail.value;
    const category = this.data.categories[index];
    this.setData({
      categoryIndex: index,
      'form.categoryId': category.id,
      'form.categoryName': category.name
    });
    this.checkCanSubmit();
  },

  // 成色选择
  onConditionChange(e) {
    const index = e.detail.value;
    const condition = this.data.conditions[index];
    this.setData({
      conditionIndex: index,
      'form.conditionLevel': condition.label
    });
    this.checkCanSubmit();
  },

  // 原价输入
  onPriceInput(e) {
    this.setData({
      'form.originalPrice': e.detail.value
    });
  },

  // 跳转到AI估价
  goToAIEvaluation() {
    const { form } = this.data;
    const params = [];
    if (form.title) params.push(`name=${encodeURIComponent(form.title)}`);
    if (form.description) params.push(`desc=${encodeURIComponent(form.description)}`);
    
    wx.navigateTo({
      url: `/pages/ai/valuation/valuation?${params.join('&')}`
    });
  },

  // 成色描述
  onConditionDescInput(e) {
    this.setData({
      'form.conditionDescription': e.detail.value
    });
    this.checkCanSubmit();
  },

  // 交换类型
  onExchangeTypeChange(e) {
    this.setData({
      'form.exchangeType': e.currentTarget.dataset.type
    });
  },

  // 想要换什么
  onWantDescInput(e) {
    this.setData({
      'form.wantDescription': e.detail.value
    });
  },

  // 补差价开关
  onCashAcceptChange(e) {
    this.setData({
      'form.cashAcceptable': e.detail.value
    });
  },

  // 差价范围
  onCashMinInput(e) {
    this.setData({
      'form.cashMin': e.detail.value
    });
  },

  onCashMaxInput(e) {
    this.setData({
      'form.cashMax': e.detail.value
    });
  },

  // 选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'form.locationName': res.name || res.address
        });
      }
    });
  },

  // 获取AI估值
  async getAiValuation() {
    const { form } = this.data;

    // 验证必填项
    if (!form.title || !form.categoryName || !form.conditionLevel) {
      wx.showToast({ title: '请先填写基本信息', icon: 'none' });
      return;
    }

    this.setData({ isAiLoading: true });

    try {
      // 使用 AI 估值预览接口
      const res = await app.request({
        url: '/ai/evaluate/preview',
        method: 'POST',
        data: {
          title: form.title,
          description: form.conditionDescription,
          category: form.categoryName,
          original_price: form.originalPrice,
          condition_level: form.conditionLevel,
          condition_description: form.conditionDescription
        }
      });

      if (res.success) {
        this.setData({
          aiEvaluation: res.data
        });
        wx.showToast({ title: 'AI估值完成', icon: 'success' });
      }
    } catch (error) {
      wx.showToast({ title: '估值失败，请重试', icon: 'none' });
    } finally {
      this.setData({ isAiLoading: false });
    }
  },

  // 检查是否可以提交
  checkCanSubmit() {
    const { form, images } = this.data;
    const canSubmit = form.title && 
                      form.categoryName && 
                      form.conditionLevel && 
                      form.conditionDescription &&
                      images.length > 0;
    
    this.setData({ canSubmit });
  },

  // 提交表单
  async submitForm() {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...', mask: true });

    try {
      // 先上传图片到服务器
      const uploadedImages = [];
      for (const image of this.data.images) {
        try {
          const url = await app.uploadImage(image);
          uploadedImages.push(url);
        } catch (uploadError) {
          console.error('图片上传失败:', uploadError);
          wx.hideLoading();
          wx.showToast({ title: '图片上传失败', icon: 'none' });
          return;
        }
      }

      const { form, aiEvaluation } = this.data;

      // 构建提交数据
      const submitData = {
        title: form.title,
        category_id: form.categoryId,
        condition_level: form.conditionLevel,
        condition_description: form.conditionDescription,
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        images: uploadedImages,
        cover_image: uploadedImages[0],
        exchange_type: form.exchangeType,
        want_description: form.wantDescription,
        cash_acceptable: form.cashAcceptable,
        cash_adjustment_range: form.cashAcceptable ? {
          min: form.cashMin ? parseFloat(form.cashMin) : 0,
          max: form.cashMax ? parseFloat(form.cashMax) : null
        } : null,
        location_name: form.locationName
      };

      // 如果有AI估值，添加估值信息
      if (aiEvaluation && aiEvaluation.success) {
        submitData.estimated_value_min = aiEvaluation.estimated_value_min;
        submitData.estimated_value_max = aiEvaluation.estimated_value_max;
        submitData.estimated_value_ai = aiEvaluation.estimated_value_ai;
        submitData.ai_description = aiEvaluation.ai_description;
        submitData.ai_tags = aiEvaluation.ai_tags;
        submitData.ai_features = aiEvaluation.ai_features;
      }

      const res = await app.request({
        url: '/items',
        method: 'POST',
        data: submitData
      });

      wx.hideLoading();

      if (res.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }, 2000);
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none'
      });
    }
  }
});
