const Message = require('../models/Message');
const Exchange = require('../models/Exchange');

/**
 * 发送消息
 */
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { exchange_id, content, content_type = 'text' } = req.body;

    // 验证必填字段
    if (!exchange_id || !content) {
      return res.status(400).json({
        success: false,
        message: '交换ID和消息内容为必填项'
      });
    }

    // 验证交换请求是否存在
    const exchange = await Exchange.findById(exchange_id);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        message: '交换请求不存在'
      });
    }

    // 验证是否是参与方
    if (exchange.requester_id !== senderId && exchange.target_id !== senderId) {
      return res.status(403).json({
        success: false,
        message: '无权在此交换中发送消息'
      });
    }

    // 验证交换状态是否允许聊天
    if (exchange.status === 'rejected' || exchange.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '该交换已关闭，无法发送消息'
      });
    }

    // 创建消息
    const message = await Message.create({
      exchange_id,
      sender_id: senderId,
      content,
      content_type
    });

    // 获取完整消息信息
    const fullMessage = await Message.findById(message.id);

    res.json({
      success: true,
      data: fullMessage,
      message: '发送成功'
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({
      success: false,
      message: '发送消息失败'
    });
  }
};

/**
 * 获取消息列表
 */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { exchange_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // 验证交换请求是否存在
    const exchange = await Exchange.findById(exchange_id);
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
        message: '无权查看此交换的消息'
      });
    }

    // 获取消息列表
    const messages = await Message.findByExchangeId(exchange_id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    // 标记消息为已读
    await Message.markAsRead(exchange_id, userId);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取消息列表失败'
    });
  }
};

/**
 * 获取最新消息列表（会话列表）
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // 获取用户参与的所有交换的最新消息
    const messages = await Message.findLatestByUser(userId);

    // 格式化数据
    const conversations = messages.map(msg => ({
      exchange_id: msg.exchange_id,
      last_message: {
        id: msg.id,
        content: msg.content,
        content_type: msg.content_type,
        sender_id: msg.sender_id,
        sender_nickname: msg.sender_nickname,
        sender_avatar: msg.sender_avatar,
        created_at: msg.created_at,
        is_read: msg.is_read
      },
      exchange_status: msg.exchange_status,
      is_requester: msg.requester_id === userId
    }));

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败'
    });
  }
};

/**
 * 获取未读消息数量
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    const { exchange_id } = req.query;

    let count;
    if (exchange_id) {
      count = await Message.getUnreadCountByExchange(exchange_id, userId);
    } else {
      count = await Message.getUnreadCount(userId);
    }

    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    res.status(500).json({
      success: false,
      message: '获取未读消息数量失败'
    });
  }
};

/**
 * 标记消息为已读
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { exchange_id } = req.params;

    // 验证交换请求是否存在
    const exchange = await Exchange.findById(exchange_id);
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
        message: '无权操作此交换'
      });
    }

    await Message.markAsRead(exchange_id, userId);

    res.json({
      success: true,
      message: '已标记为已读'
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记已读失败'
    });
  }
};
