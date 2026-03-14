const Favorite = require('../models/Favorite');
const Item = require('../models/Item');

/**
 * 添加收藏
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_id } = req.body;

    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: '物品ID为必填项'
      });
    }

    // 验证物品是否存在
    const item = await Item.findById(item_id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 不能收藏自己的物品
    if (item.owner_id === userId) {
      return res.status(400).json({
        success: false,
        message: '不能收藏自己的物品'
      });
    }

    // 检查是否已收藏
    const exists = await Favorite.exists(userId, item_id);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: '已经收藏过该物品'
      });
    }

    // 添加收藏
    const favorite = await Favorite.create(userId, item_id);

    res.json({
      success: true,
      data: favorite,
      message: '收藏成功'
    });
  } catch (error) {
    console.error('添加收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '添加收藏失败'
    });
  }
};

/**
 * 取消收藏
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_id } = req.params;

    // 取消收藏
    const favorite = await Favorite.delete(userId, item_id);

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: '收藏不存在'
      });
    }

    res.json({
      success: true,
      message: '已取消收藏'
    });
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json({
      success: false,
      message: '取消收藏失败'
    });
  }
};

/**
 * 检查是否已收藏
 */
exports.checkFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_id } = req.params;

    const exists = await Favorite.exists(userId, item_id);

    res.json({
      success: true,
      data: { is_favorite: exists }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: '检查收藏状态失败'
    });
  }
};

/**
 * 获取我的收藏列表
 */
exports.getMyFavorites = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const favorites = await Favorite.findByUser(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    console.error('获取收藏列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败'
    });
  }
};

/**
 * 获取收藏数量
 */
exports.getFavoriteCount = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_id } = req.query;

    let count;
    if (item_id) {
      count = await Favorite.countByItem(item_id);
    } else {
      count = await Favorite.countByUser(userId);
    }

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取收藏数量失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收藏数量失败'
    });
  }
};

/**
 * 批量获取收藏状态
 */
exports.batchCheckFavorites = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_ids } = req.body;

    if (!Array.isArray(item_ids)) {
      return res.status(400).json({
        success: false,
        message: 'item_ids 必须是数组'
      });
    }

    // 获取用户收藏的物品ID列表
    const favoriteIds = await Favorite.getItemIdsByUser(userId);

    // 构建结果
    const result = {};
    item_ids.forEach(id => {
      result[id] = favoriteIds.includes(parseInt(id));
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('批量检查收藏状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量检查收藏状态失败'
    });
  }
};
