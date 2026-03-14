const aiService = require('../services/aiService');
const Item = require('../models/Item');
const { query } = require('../config/database');

/**
 * 对物品进行 AI 估值
 */
exports.evaluateItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_id } = req.body;

    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: '物品ID为必填项'
      });
    }

    // 获取物品信息
    const item = await Item.findById(item_id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '物品不存在'
      });
    }

    // 验证权限（只能给自己的物品估值）
    if (item.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能给自己的物品进行估值'
      });
    }

    // 调用 AI 估值服务
    const evaluation = await aiService.evaluateItem({
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category_name,
      condition_level: item.condition_level,
      condition_description: item.condition_description,
      original_price: item.original_price,
      images: item.images
    });

    // 如果估值成功，更新物品信息
    if (evaluation.success) {
      await query(
        `UPDATE items 
         SET estimated_value_min = $1,
             estimated_value_max = $2,
             estimated_value_ai = $3,
             ai_description = $4,
             ai_tags = $5,
             ai_features = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          evaluation.estimated_value_min,
          evaluation.estimated_value_max,
          evaluation.estimated_value_ai,
          evaluation.ai_description,
          evaluation.ai_tags,
          JSON.stringify(evaluation.ai_features),
          item_id
        ]
      );
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('AI 估值失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI 估值失败',
      error: error.message
    });
  }
};

/**
 * 预览估值（不保存到数据库）
 */
exports.previewEvaluation = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition_level,
      condition_description,
      original_price
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '物品标题为必填项'
      });
    }

    // 调用 AI 估值服务
    const evaluation = await aiService.evaluateItem({
      title,
      description,
      category,
      condition_level,
      condition_description,
      original_price
    });

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('AI 估值预览失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI 估值预览失败'
    });
  }
};

/**
 * 批量估值
 */
exports.batchEvaluate = async (req, res) => {
  try {
    const userId = req.userId;
    const { item_ids } = req.body;

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'item_ids 必须是数组且不能为空'
      });
    }

    if (item_ids.length > 10) {
      return res.status(400).json({
        success: false,
        message: '单次最多批量估值 10 个物品'
      });
    }

    // 获取所有物品信息
    const items = [];
    for (const itemId of item_ids) {
      const item = await Item.findById(itemId);
      if (item && item.owner_id === userId) {
        items.push({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category_name,
          condition_level: item.condition_level,
          condition_description: item.condition_description,
          original_price: item.original_price,
          images: item.images
        });
      }
    }

    // 批量估值
    const results = await aiService.batchEvaluate(items);

    // 更新数据库
    for (const result of results) {
      if (result.success && result.item_id) {
        await query(
          `UPDATE items 
           SET estimated_value_min = $1,
               estimated_value_max = $2,
               estimated_value_ai = $3,
               ai_description = $4,
               ai_tags = $5,
               ai_features = $6,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $7`,
          [
            result.estimated_value_min,
            result.estimated_value_max,
            result.estimated_value_ai,
            result.ai_description,
            result.ai_tags,
            JSON.stringify(result.ai_features),
            result.item_id
          ]
        );
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('批量估值失败:', error);
    res.status(500).json({
      success: false,
      message: '批量估值失败'
    });
  }
};

/**
 * 获取 AI 配置信息
 */
exports.getAIConfig = async (req, res) => {
  try {
    const { AI_CONFIG } = aiService;
    
    res.json({
      success: true,
      data: {
        enabled: AI_CONFIG.enabled,
        model: AI_CONFIG.model,
        provider: '阿里百炼',
        // 不返回 API Key 和 baseURL
      }
    });
  } catch (error) {
    console.error('获取 AI 配置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取 AI 配置失败'
    });
  }
};
