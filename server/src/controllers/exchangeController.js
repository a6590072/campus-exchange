const Exchange = require('../models/Exchange');
const Item = require('../models/Item');
const User = require('../models/User');
const { query } = require('../config/database');

/**
 * 发起交换请求
 */
exports.createExchange = async (req, res) => {
  try {
    const requesterId = req.userId;
    const {
      target_item_id,
      requester_item_id,
      message,
      cash_offer = 0
    } = req.body;

    // 验证必填字段
    if (!target_item_id) {
      return res.status(400).json({
        success: false,
        message: '目标物品ID为必填项'
      });
    }

    // 获取目标物品信息
    const targetItem = await Item.findById(target_item_id);
    if (!targetItem) {
      return res.status(404).json({
        success: false,
        message: '目标物品不存在'
      });
    }

    // 不能向自己的物品发起交换
    if (targetItem.owner_id === requesterId) {
      return res.status(400).json({
        success: false,
        message: '不能向自己的物品发起交换'
      });
    }

    // 检查物品是否可交换
    if (targetItem.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '该物品当前不可交换'
      });
    }

    // 如果提供了自己的物品，验证物品存在且属于自己
    if (requester_item_id) {
      const requesterItem = await Item.findById(requester_item_id);
      if (!requesterItem) {
        return res.status(404).json({
          success: false,
          message: '自己的物品不存在'
        });
      }
      if (requesterItem.owner_id !== requesterId) {
        return res.status(403).json({
          success: false,
          message: '只能使用自己的物品进行交换'
        });
      }
      if (requesterItem.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: '您的物品当前不可交换'
        });
      }
    }

    // 检查是否已存在待处理的交换请求
    const existsPending = await Exchange.existsPending(requesterId, target_item_id);
    if (existsPending) {
      return res.status(400).json({
        success: false,
        message: '您已向该物品发起过交换请求，请等待对方回复'
      });
    }

    // 创建交换请求
    const exchange = await Exchange.create({
      requester_id: requesterId,
      target_id: targetItem.owner_id,
      requester_item_id: requester_item_id || null,
      target_item_id,
      message,
      cash_offer: parseFloat(cash_offer) || 0
    });

    // 增加物品的交换请求计数
    await query(
      'UPDATE items SET exchange_request_count = exchange_request_count + 1 WHERE id = $1',
      [target_item_id]
    );

    res.json({
      success: true,
      data: exchange,
      message: '交换请求已发送'
    });
  } catch (error) {
    console.error('发起交换请求失败:', error);
    res.status(500).json({
      success: false,
      message: '发起交换请求失败',
      error: error.message
    });
  }
};

/**
 * 接受交换请求
 */
exports.acceptExchange = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // 获取交换请求
    const exchange = await Exchange.findById(id);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '交换请求不存在'
      });
    }

    // 验证是否是目标方
    if (exchange.target_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此交换请求'
      });
    }

    // 验证状态
    if (exchange.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该交换请求已处理'
      });
    }

    // 更新状态为已接受
    const updatedExchange = await Exchange.updateStatus(id, 'accepted');

    res.json({
      success: true,
      data: updatedExchange,
      message: '已接受交换请求'
    });
  } catch (error) {
    console.error('接受交换请求失败:', error);
    res.status(500).json({
      success: false,
      message: '接受交换请求失败'
    });
  }
};

/**
 * 拒绝交换请求
 */
exports.rejectExchange = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // 获取交换请求
    const exchange = await Exchange.findById(id);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '交换请求不存在'
      });
    }

    // 验证是否是目标方
    if (exchange.target_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此交换请求'
      });
    }

    // 验证状态
    if (exchange.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该交换请求已处理'
      });
    }

    // 更新状态为已拒绝
    const updatedExchange = await Exchange.updateStatus(id, 'rejected');

    res.json({
      success: true,
      data: updatedExchange,
      message: '已拒绝交换请求'
    });
  } catch (error) {
    console.error('拒绝交换请求失败:', error);
    res.status(500).json({
      success: false,
      message: '拒绝交换请求失败'
    });
  }
};

/**
 * 完成交换
 */
exports.completeExchange = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // 获取交换请求
    const exchange = await Exchange.findById(id);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '交换请求不存在'
      });
    }

    // 验证是否是参与方
    if (exchange.requester_id !== userId && exchange.target_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权操作此交换请求'
      });
    }

    // 验证状态
    if (exchange.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: '交换请求未处于已接受状态'
      });
    }

    // 更新状态为已完成
    const updatedExchange = await Exchange.updateStatus(id, 'completed');

    // 标记物品为已交换
    await Item.markAsExchanged(exchange.target_item_id);
    if (exchange.requester_item_id) {
      await Item.markAsExchanged(exchange.requester_item_id);
    }

    // 增加双方交换计数
    await User.incrementCounter(exchange.requester_id, 'exchange_count');
    await User.incrementCounter(exchange.target_id, 'exchange_count');

    res.json({
      success: true,
      data: updatedExchange,
      message: '交换已完成'
    });
  } catch (error) {
    console.error('完成交换失败:', error);
    res.status(500).json({
      success: false,
      message: '完成交换失败'
    });
  }
};

/**
 * 取消交换请求
 */
exports.cancelExchange = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // 取消交换请求
    const exchange = await Exchange.cancel(id, userId);
    
    if (!exchange) {
      return res.status(400).json({
        success: false,
        message: '交换请求不存在或无法取消'
      });
    }

    res.json({
      success: true,
      data: exchange,
      message: '交换请求已取消'
    });
  } catch (error) {
    console.error('取消交换请求失败:', error);
    res.status(500).json({
      success: false,
      message: '取消交换请求失败'
    });
  }
};

/**
 * 获取我发起的交换请求
 */
exports.getSentExchanges = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const exchanges = await Exchange.findByRequester(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    console.error('获取发起的交换请求失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发起的交换请求失败'
    });
  }
};

/**
 * 获取我收到的交换请求
 */
exports.getReceivedExchanges = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const exchanges = await Exchange.findByTarget(userId, {
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: exchanges
    });
  } catch (error) {
    console.error('获取收到的交换请求失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收到的交换请求失败'
    });
  }
};

/**
 * 获取交换请求详情
 */
exports.getExchangeDetail = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const exchange = await Exchange.findById(id);
    
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '交换请求不存在'
      });
    }

    // 验证是否是参与方
    if (exchange.requester_id !== userId && exchange.target_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '无权查看此交换请求'
      });
    }

    res.json({
      success: true,
      data: exchange
    });
  } catch (error) {
    console.error('获取交换请求详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取交换请求详情失败'
    });
  }
};

/**
 * 获取交换统计
 */
exports.getExchangeStats = async (req, res) => {
  try {
    const userId = req.userId;
    const stats = await Exchange.getStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取交换统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取交换统计失败'
    });
  }
};
