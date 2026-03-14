const { query, transaction } = require('../config/database');

class Exchange {
  /**
   * 根据ID查找交换请求
   */
  static async findById(id) {
    const result = await query(
      `SELECT e.*,
              -- 发起方信息
              req_user.nickname as requester_nickname,
              req_user.avatar_url as requester_avatar,
              req_user.credit_score as requester_credit_score,
              -- 目标方信息
              target_user.nickname as target_nickname,
              target_user.avatar_url as target_avatar,
              target_user.credit_score as target_credit_score,
              -- 发起方物品
              req_item.title as requester_item_title,
              req_item.cover_image as requester_item_image,
              req_item.condition_level as requester_item_condition,
              -- 目标物品
              target_item.title as target_item_title,
              target_item.cover_image as target_item_image,
              target_item.condition_level as target_item_condition
       FROM exchange_requests e
       JOIN users req_user ON e.requester_id = req_user.id
       JOIN users target_user ON e.target_id = target_user.id
       LEFT JOIN items req_item ON e.requester_item_id = req_item.id
       JOIN items target_item ON e.target_item_id = target_item.id
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建交换请求
   */
  static async create(exchangeData) {
    const {
      requester_id,
      target_id,
      requester_item_id,
      target_item_id,
      message,
      cash_offer = 0
    } = exchangeData;

    const result = await query(
      `INSERT INTO exchange_requests (
        requester_id, target_id, requester_item_id, target_item_id,
        message, cash_offer, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *`,
      [requester_id, target_id, requester_item_id, target_item_id, message, cash_offer]
    );

    return result.rows[0];
  }

  /**
   * 更新交换请求状态
   */
  static async updateStatus(id, status, additionalData = {}) {
    const allowedStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    let updateFields = ['status = $1'];
    let values = [status];
    let paramIndex = 2;

    // 根据状态添加时间戳
    if (status === 'accepted' || status === 'rejected') {
      updateFields.push(`responded_at = CURRENT_TIMESTAMP`);
    }
    if (status === 'completed') {
      updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
    }

    // 添加其他更新字段
    for (const [key, value] of Object.entries(additionalData)) {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }

    values.push(id);
    const result = await query(
      `UPDATE exchange_requests 
       SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * 获取我发起的交换请求
   */
  static async findByRequester(requesterId, { status, page = 1, limit = 10 } = {}) {
    let sql = `
      SELECT e.*,
             target_user.nickname as target_nickname,
             target_user.avatar_url as target_avatar,
             req_item.title as requester_item_title,
             req_item.cover_image as requester_item_image,
             target_item.title as target_item_title,
             target_item.cover_image as target_item_image
      FROM exchange_requests e
      JOIN users target_user ON e.target_id = target_user.id
      LEFT JOIN items req_item ON e.requester_item_id = req_item.id
      JOIN items target_item ON e.target_item_id = target_item.id
      WHERE e.requester_id = $1
    `;
    const params = [requesterId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY e.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * 获取我收到的交换请求
   */
  static async findByTarget(targetId, { status, page = 1, limit = 10 } = {}) {
    let sql = `
      SELECT e.*,
             req_user.nickname as requester_nickname,
             req_user.avatar_url as requester_avatar,
             req_user.credit_score as requester_credit_score,
             req_item.title as requester_item_title,
             req_item.cover_image as requester_item_image,
             target_item.title as target_item_title,
             target_item.cover_image as target_item_image
      FROM exchange_requests e
      JOIN users req_user ON e.requester_id = req_user.id
      LEFT JOIN items req_item ON e.requester_item_id = req_item.id
      JOIN items target_item ON e.target_item_id = target_item.id
      WHERE e.target_id = $1
    `;
    const params = [targetId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND e.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY e.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * 获取交换请求总数（用于统计）
   */
  static async countByUser(userId, type = 'all') {
    let sql = '';
    let params = [userId];

    if (type === 'sent') {
      sql = 'SELECT COUNT(*) as total FROM exchange_requests WHERE requester_id = $1';
    } else if (type === 'received') {
      sql = 'SELECT COUNT(*) as total FROM exchange_requests WHERE target_id = $1';
    } else {
      sql = 'SELECT COUNT(*) as total FROM exchange_requests WHERE requester_id = $1 OR target_id = $1';
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * 检查是否已存在待处理的交换请求
   */
  static async existsPending(requesterId, targetItemId) {
    const result = await query(
      `SELECT id FROM exchange_requests 
       WHERE requester_id = $1 
       AND target_item_id = $2 
       AND status = 'pending'`,
      [requesterId, targetItemId]
    );
    return result.rows.length > 0;
  }

  /**
   * 取消交换请求（只有发起方可以取消，且状态必须是pending）
   */
  static async cancel(id, requesterId) {
    const result = await query(
      `UPDATE exchange_requests 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND requester_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, requesterId]
    );
    return result.rows[0] || null;
  }

  /**
   * 获取交换统计
   */
  static async getStats(userId) {
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending' AND target_id = $1) as pending_received,
        COUNT(*) FILTER (WHERE status = 'pending' AND requester_id = $1) as pending_sent,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM exchange_requests
      WHERE requester_id = $1 OR target_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = Exchange;
