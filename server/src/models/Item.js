const { query, transaction, getMemoryDB, useMemoryDB } = require('../config/database');

class Item {
  /**
   * 根据ID查找物品
   */
  static async findById(id) {
    const result = await query(
      `SELECT i.*, 
              u.nickname as owner_nickname, 
              u.avatar_url as owner_avatar,
              u.credit_score as owner_credit_score,
              c.name as category_name,
              c.icon as category_icon
       FROM items i
       JOIN users u ON i.owner_id = u.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = $1 AND i.status != 'deleted'`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 创建新物品
   */
  static async create(itemData) {
    const {
      owner_id,
      title,
      description,
      category_id,
      condition_level,
      condition_description,
      original_price,
      estimated_value_min,
      estimated_value_max,
      estimated_value_ai,
      images,
      cover_image,
      exchange_type,
      want_description,
      want_category_ids,
      cash_acceptable,
      cash_adjustment_range,
      location_name,
      ai_tags,
      ai_description,
      ai_features
    } = itemData;

    const result = await query(
      `INSERT INTO items (
        owner_id, title, description, category_id,
        condition_level, condition_description,
        original_price, estimated_value_min, estimated_value_max, estimated_value_ai,
        images, cover_image,
        exchange_type, want_description, want_category_ids,
        cash_acceptable, cash_adjustment_range,
        location_name,
        ai_tags, ai_description, ai_features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        owner_id, title, description, category_id,
        condition_level, condition_description,
        original_price, estimated_value_min, estimated_value_max, estimated_value_ai,
        images, cover_image,
        exchange_type, want_description, want_category_ids,
        cash_acceptable, cash_adjustment_range,
        location_name,
        ai_tags, ai_description, ai_features
      ]
    );

    return result.rows[0];
  }

  /**
   * 更新物品
   */
  static async update(id, updateData) {
    const allowedFields = [
      'title', 'description', 'category_id',
      'condition_level', 'condition_description',
      'original_price', 'estimated_value_min', 'estimated_value_max', 'estimated_value_ai',
      'images', 'cover_image',
      'exchange_type', 'want_description', 'want_category_ids',
      'cash_acceptable', 'cash_adjustment_range',
      'location_name',
      'ai_tags', 'ai_description', 'ai_features',
      'status'
    ];

    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const result = await query(
      `UPDATE items SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex} AND status != 'deleted'
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * 删除物品（软删除）
   */
  static async delete(id) {
    const result = await query(
      `UPDATE items SET status = 'deleted', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * 获取物品列表
   */
  static async findList({ categoryId, status = 'active', page = 1, limit = 10, excludeUserId = null }) {
    let sql = `
      SELECT i.*, 
             u.nickname as owner_nickname, 
             u.avatar_url as owner_avatar,
             u.credit_score as owner_credit_score,
             c.name as category_name,
             c.icon as category_icon
      FROM items i
      JOIN users u ON i.owner_id = u.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.status = $1
    `;
    const params = [status];
    let paramIndex = 2;

    if (categoryId) {
      sql += ` AND i.category_id = $${paramIndex}`;
      params.push(categoryId);
      paramIndex++;
    }

    if (excludeUserId) {
      sql += ` AND i.owner_id != $${paramIndex}`;
      params.push(excludeUserId);
      paramIndex++;
    }

    sql += ` ORDER BY i.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * 获取物品总数
   */
  static async count({ categoryId, status = 'active' }) {
    let sql = 'SELECT COUNT(*) as total FROM items WHERE status = $1';
    const params = [status];

    if (categoryId) {
      sql += ' AND category_id = $2';
      params.push(categoryId);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].total);
  }

  /**
   * 获取用户的物品列表
   */
  static async findByUserId(userId, { status, page = 1, limit = 10 } = {}) {
    let sql = `
      SELECT i.*, 
             c.name as category_name,
             c.icon as category_icon
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.owner_id = $1 AND i.status != 'deleted'
    `;
    const params = [userId];
    let paramIndex = 2;

    if (status) {
      sql += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    sql += ` ORDER BY i.created_at DESC`;
    
    const offset = (page - 1) * limit;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * 增加浏览次数
   */
  static async incrementViewCount(id) {
    const result = await query(
      'UPDATE items SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count',
      [id]
    );
    return result.rows[0]?.view_count;
  }

  /**
   * 增加收藏次数
   */
  static async incrementFavoriteCount(id, delta = 1) {
    const result = await query(
      'UPDATE items SET favorite_count = GREATEST(0, favorite_count + $1) WHERE id = $2 RETURNING favorite_count',
      [delta, id]
    );
    return result.rows[0]?.favorite_count;
  }

  /**
   * 获取首页数据
   */
  static async getHomeData(limit = 6) {
    // 如果使用内存数据库
    if (useMemoryDB()) {
      const memoryDB = getMemoryDB();
      const items = memoryDB.items.filter(i => i.status === 'active');
      
      // 最新物品
      const latest = [...items]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
      
      // 热门物品（按浏览量）
      const hot = [...items]
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 4);
      
      return { latest, hot };
    }
    
    // 最新物品
    const latestResult = await query(
      `SELECT i.*, 
              u.nickname as owner_nickname, 
              u.avatar_url as owner_avatar,
              c.name as category_name
       FROM items i
       JOIN users u ON i.owner_id = u.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.status = 'active'
       ORDER BY i.created_at DESC
       LIMIT $1`,
      [limit]
    );

    // 热门物品（按浏览量）
    const hotResult = await query(
      `SELECT i.*, 
              u.nickname as owner_nickname, 
              u.avatar_url as owner_avatar,
              c.name as category_name
       FROM items i
       JOIN users u ON i.owner_id = u.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.status = 'active'
       ORDER BY i.view_count DESC
       LIMIT $1`,
      [4]
    );

    return {
      latest: latestResult.rows,
      hot: hotResult.rows
    };
  }

  /**
   * 标记物品为已交换
   */
  static async markAsExchanged(id) {
    const result = await query(
      `UPDATE items SET status = 'exchanged', exchanged_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Item;
