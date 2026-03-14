const { query } = require('../config/database');

class Message {
  /**
   * 创建消息
   */
  static async create(messageData) {
    const {
      exchange_id,
      sender_id,
      content,
      content_type = 'text'
    } = messageData;

    const result = await query(
      `INSERT INTO exchange_messages (exchange_id, sender_id, content, content_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [exchange_id, sender_id, content, content_type]
    );

    return result.rows[0];
  }

  /**
   * 根据ID查找消息
   */
  static async findById(id) {
    const result = await query(
      `SELECT m.*,
              u.nickname as sender_nickname,
              u.avatar_url as sender_avatar
       FROM exchange_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 获取交换请求的消息列表
   */
  static async findByExchangeId(exchangeId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT m.*,
              u.nickname as sender_nickname,
              u.avatar_url as sender_avatar
       FROM exchange_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.exchange_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [exchangeId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取用户参与的所有交换的最新消息
   */
  static async findLatestByUser(userId) {
    const result = await query(
      `SELECT DISTINCT ON (m.exchange_id)
              m.*,
              u.nickname as sender_nickname,
              u.avatar_url as sender_avatar,
              e.requester_id,
              e.target_id,
              e.status as exchange_status
       FROM exchange_messages m
       JOIN users u ON m.sender_id = u.id
       JOIN exchange_requests e ON m.exchange_id = e.id
       WHERE e.requester_id = $1 OR e.target_id = $1
       ORDER BY m.exchange_id, m.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * 标记消息为已读
   */
  static async markAsRead(exchangeId, userId) {
    await query(
      `UPDATE exchange_messages 
       SET is_read = true
       WHERE exchange_id = $1 AND sender_id != $2 AND is_read = false`,
      [exchangeId, userId]
    );
  }

  /**
   * 获取未读消息数量
   */
  static async getUnreadCount(userId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM exchange_messages m
       JOIN exchange_requests e ON m.exchange_id = e.id
       WHERE (e.requester_id = $1 OR e.target_id = $1)
       AND m.sender_id != $1
       AND m.is_read = false`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * 获取指定交换的未读消息数量
   */
  static async getUnreadCountByExchange(exchangeId, userId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM exchange_messages
       WHERE exchange_id = $1 
       AND sender_id != $2 
       AND is_read = false`,
      [exchangeId, userId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * 删除消息（软删除，实际项目中可能需要）
   */
  static async delete(id) {
    await query(
      'DELETE FROM exchange_messages WHERE id = $1',
      [id]
    );
  }
}

module.exports = Message;
