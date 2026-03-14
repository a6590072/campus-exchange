const app = getApp();

Page({
  data: {
    itemId: null,
    item: null,
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
    categoryIndex: -1,
    conditionIndex: -1,
    loading: false,
    saving: false
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    this.setData({ itemId: id });
    this.loadItemDetail(id);
  },

  // 加载物品详情
  async loadItemDetail(itemId) {
    this.setData({ loading: true });

    try {
      const res = await app.request({
        url: `/items/${itemId}`
      });

      if (res.success) {
        const item = res.data;
        
        // 查找分类索引
        const categoryIndex = this.data.categories.findIndex(c => c.id === item.category_id);
        
        // 查找成色索引
        const conditionIndex = this.data.conditions.findIndex(c => c.label === item.condition_level);

        this.setData({
          item,
          images: item.images || [],
          categoryIndex,
          conditionIndex,
          form: {
            title: item.title || '',
            categoryId: item.category_id,
            categoryName: item.category_name || '',
            conditionLevel: item.condition_level || '',
            conditionDescription: item.condition_description || '',
            originalPrice: item.original_price ? String(item.original_price) : '',
            exchangeType: item.exchange_type || 'any',
            wantDescription: item.want_description || '',
            cashAcceptable: item.cash_acceptable !== false,
            cashMin: item.cash_adjustment_range?.min ? String(item.cash_adjustment_range.min) : '',
            cashMax: item.cash_adjustment_range?.max ? String(item.cash_adjustment_range.max) : '',
            locationName: item.location_name || ''
          },
          loading: false
        });
      }
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
      wx.navigateBack();
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
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value });
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
  },

  // 成色选择
  onConditionChange(e) {
    const index = e.detail.value;
    const condition = this.data.conditions[index];
    this.setData({
      conditionIndex: index,
      'form.conditionLevel': condition.label
    });
  },

  // 成色描述
  onConditionDescInput(e) {
    this.setData({ 'form.conditionDescription': e.detail.value });
  },

  // 原价输入
  onPriceInput(e) {
    this.setData({ 'form.originalPrice': e.detail.value });
  },

  // 交换类型
  onExchangeTypeChange(e) {
    this.setData({ 'form.exchangeType': e.currentTarget.dataset.type });
  },

  // 想要换什么
  onWantDescInput(e) {
    this.setData({ 'form.wantDescription': e.detail.value });
  },

  // 补差价开关
  onCashAcceptChange(e) {
    this.setData({ 'form.cashAcceptable': e.detail.value });
  },

  // 差价范围
  onCashMinInput(e) {
    this.setData({ 'form.cashMin': e.detail.value });
  },

  onCashMaxInput(e) {
    this.setData({ 'form.cashMax': e.detail.value });
  },

  // 选择位置
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({ 'form.locationName': res.name || res.address });
      }
    });
  },

  // 保存修改
  async saveItem() {
    const { form, images, itemId } = this.data;

    if (!form.title || !form.categoryName || !form.conditionLevel) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    this.setData({ saving: true });

    try {
      // 上传新图片
      const uploadedImages = [];
      for (const image of images) {
        if (image.startsWith('http')) {
          // 已经是上传过的图片
          uploadedImages.push(image);
        } else {
          // 新选择的图片，需要上传
          try {
            const url = await app.uploadImage(image);
            uploadedImages.push(url);
          } catch (uploadError) {
            console.error('图片上传失败:', uploadError);
            this.setData({ saving: false });
            wx.showToast({ title: '图片上传失败', icon: 'none' });
            return;
          }
        }
      }

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

      const res = await app.request({
        url: `/items/${itemId}`,
        method: 'PUT',
        data: submitData
      });

      this.setData({ saving: false });

      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      this.setData({ saving: false });
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
  },

  // 下架物品
  async offlineItem() {
    const { itemId } = this.data;
    
    wx.showModal({
      title: '确认下架',
      content: '确定要下架这个物品吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await app.request({
              url: `/items/${itemId}/status`,
              method: 'PUT',
              data: { status: 'offline' }
            });

            if (result.success) {
              wx.showToast({ title: '已下架', icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            }
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
