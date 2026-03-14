const Item = require('../models/Item');
const User = require('../models/User');

/**
 * 获取物品列表
 */
exports.getItems = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    const items = await Item.findList({
      categoryId: category,
      status: 'active',
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Item.count({
      categoryId: category,
      status: 'active'
    });

    res.json({
      success: true,
      data: {
        list: items,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取物品列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取物品列表失败'
    });
  }
};

/**
 * 获取物品详情
 */
exports.getItemDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const item = await Item.findById(id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 增加浏览次数
    await Item.incrementViewCount(id);

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('获取物品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取物品详情失败'
    });
  }
};

/**
 * 发布物品
 */
exports.createItem = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      title,
      description,
      category_id,
      condition_level,
      condition_description,
      original_price,
      images,
      exchange_type,
      want_description,
      want_category_ids,
      cash_acceptable,
      location_name
    } = req.body;

    // 验证必填字段
    if (!title || !category_id) {
      return res.status(400).json({
        success: false,
        message: '标题和分类为必填项'
      });
    }

    // 创建物品
    const item = await Item.create({
      owner_id: userId,
      title,
      description,
      category_id,
      condition_level,
      condition_description,
      original_price: original_price ? parseFloat(original_price) : null,
      images: images || [],
      cover_image: images && images.length > 0 ? images[0] : null,
      exchange_type: exchange_type || 'any',
      want_description,
      want_category_ids: want_category_ids || [],
      cash_acceptable: cash_acceptable || false,
      location_name
    });

    // 增加用户发布计数
    await User.incrementCounter(userId, 'publish_count');

    res.json({
      success: true,
      data: item,
      message: '物品发布成功'
    });
  } catch (error) {
    console.error('发布物品失败:', error);
    res.status(500).json({
      success: false,
      message: '发布物品失败',
      error: error.message
    });
  }
};

/**
 * 更新物品
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // 检查物品是否存在
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 检查是否是物品所有者
    if (item.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权修改此物品'
      });
    }

    // 如果更新了图片，更新封面图
    if (updateData.images && updateData.images.length > 0) {
      updateData.cover_image = updateData.images[0];
    }

    const updatedItem = await Item.update(id, updateData);

    res.json({
      success: true,
      data: updatedItem,
      message: '物品更新成功'
    });
  } catch (error) {
    console.error('更新物品失败:', error);
    res.status(500).json({
      success: false,
      message: '更新物品失败'
    });
  }
};

/**
 * 删除物品
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 检查物品是否存在
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 检查是否是物品所有者
    if (item.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权删除此物品'
      });
    }

    await Item.delete(id);

    res.json({
      success: true,
      message: '物品删除成功'
    });
  } catch (error) {
    console.error('删除物品失败:', error);
    res.status(500).json({
      success: false,
      message: '删除物品失败'
    });
  }
};

/**
 * 获取我的物品列表
 */
exports.getMyItems = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const items = await Item.findByUserId(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('获取我的物品失败:', error);
    res.status(500).json({
      success: false,
      message: '获取我的物品失败'
    });
  }
};

/**
 * 获取首页数据
 */
exports.getHomeData = async (req, res) => {
  try {
    const homeData = await Item.getHomeData(6);

    res.json({
      success: true,
      data: {
        latestItems: homeData.latest,
        hotItems: homeData.hot,
        banners: [
          { id: 1, image: 'https://picsum.photos/750/300?random=101', title: '校园交换季' },
          { id: 2, image: 'https://picsum.photos/750/300?random=102', title: 'AI智能估价' },
          { id: 3, image: 'https://picsum.photos/750/300?random=103', title: '安全交换指南' }
        ]
      }
    });
  } catch (error) {
    console.error('获取首页数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取首页数据失败'
    });
  }
};
