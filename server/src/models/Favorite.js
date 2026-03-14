const { query } = require('../config/database');

class Favorite {
  /**
   * 添加收藏
   */
  static async create(userId, itemId) {
    const result = await query(
      `INSERT INTO favorites (user_id, item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, item_id) DO NOTHING
       RETURNING *`,
      [userId, itemId]
    );

    if (result.rows[0]) {
      // 增加物品收藏计数
      await query(
        'UPDATE items SET favorite_count = favorite_count + 1 WHERE id = $1',
        [itemId]
      );
    }

    return result.rows[0] || null;
  }

  /**
   * 取消收藏
   */
  static async delete(userId, itemId) {
    const result = await query(
      `DELETE FROM favorites 
       WHERE user_id = $1 AND item_id = $2
       RETURNING *`,
      [userId, itemId]
    );

    if (result.rows[0]) {
      // 减少物品收藏计数
      await query(
        'UPDATE items SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = $1',
        [itemId]
      );
    }

    return result.rows[0] || null;
  }

  /**
   * 检查是否已收藏
   */
  static async exists(userId, itemId) {
    const result = await query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND item_id = $2',
      [userId, itemId]
    );
    return result.rows.length > 0;
  }

  /**
   * 获取用户的收藏列表
   */
  static async findByUser(userId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT f.*,
              i.title as item_title,
              i.description as item_description,
              i.cover_image as item_cover,
              i.status as item_status,
              i.estimated_value_min,
              i.estimated_value_max,
              u.nickname as owner_nickname,
              u.avatar_url as owner_avatar,
              u.school_name as owner_school
       FROM favorites f
       JOIN items i ON f.item_id = i.id
       JOIN users u ON i.owner_id = u.id
       WHERE f.user_id = $1 AND i.status != 'deleted'
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取用户收藏数量
   */
  static async countByUser(userId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM favorites f
       JOIN items i ON f.item_id = i.id
       WHERE f.user_id = $1 AND i.status != 'deleted'`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * 获取收藏了某物品的用户列表
   */
  static async findByItem(itemId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT f.*,
              u.nickname,
              u.avatar_url,
              u.school_name
       FROM favorites f
       JOIN users u ON f.user_id = u.id
       WHERE f.item_id = $1
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [itemId, limit, offset]
    );

    return result.rows;
  }

  /**
   * 获取物品的收藏数量
   */
  static async countByItem(itemId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM favorites WHERE item_id = $1',
      [itemId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * 获取用户收藏的物品ID列表
   */
  static async getItemIdsByUser(userId) {
    const result = await query(
      `SELECT item_id
       FROM favorites f
       JOIN items i ON f.item_id = i.id
       WHERE f.user_id = $1 AND i.status != 'deleted'`,
      [userId]
    );

    return result.rows.map(row => row.item_id);
  }
}

module.exports = Favorite;
