const { query, transaction } = require('../config/database');
const memoryDB = require('../config/memoryDb');

// 判断是否使用内存数据库
const useMemoryDB = process.env.USE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'development';

class User {
  /**
   * 根据ID查找用户
   */
  static async findById(id) {
    if (useMemoryDB) {
      return memoryDB.findUserById(id);
    }
    
    try {
      const result = await query(
        `SELECT * FROM users WHERE id = $1 AND status != 'deleted'`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.log('PostgreSQL查询失败，使用内存数据库');
      return memoryDB.findUserById(id);
    }
  }

  /**
   * 根据openid查找用户
   */
  static async findByOpenid(openid) {
    if (useMemoryDB) {
      return memoryDB.findUserByOpenid(openid);
    }
    
    try {
      const result = await query(
        `SELECT * FROM users WHERE openid = $1 AND status != 'deleted'`,
        [openid]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.log('PostgreSQL查询失败，使用内存数据库');
      return memoryDB.findUserByOpenid(openid);
    }
  }

  /**
   * 根据学号查找用户
   */
  static async findByStudentId(studentId, schoolId) {
    if (useMemoryDB) {
      // 内存数据库简单实现
      for (const user of memoryDB.users.values()) {
        if (user.student_id === studentId && user.school_id === schoolId) {
          return user;
        }
      }
      return null;
    }
    
    try {
      const result = await query(
        `SELECT * FROM users WHERE student_id = $1 AND school_id = $2 AND status != 'deleted'`,
        [studentId, schoolId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.log('PostgreSQL查询失败，使用内存数据库');
      for (const user of memoryDB.users.values()) {
        if (user.student_id === studentId && user.school_id === schoolId) {
          return user;
        }
      }
      return null;
    }
  }

  /**
   * 创建新用户
   */
  static async create(userData) {
    if (useMemoryDB) {
      return memoryDB.createUser(userData);
    }
    
    try {
      const {
        openid,
        unionid,
        nickname,
        avatar_url,
        gender = 0,
        school_id,
        school_name
      } = userData;

      const result = await query(
        `INSERT INTO users (openid, unionid, nickname, avatar_url, gender, school_id, school_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [openid, unionid, nickname, avatar_url, gender, school_id, school_name]
      );

      return result.rows[0];
    } catch (error) {
      console.log('PostgreSQL插入失败，使用内存数据库');
      return memoryDB.createUser(userData);
    }
  }

  /**
   * 更新用户信息
   */
  static async update(id, updateData) {
    if (useMemoryDB) {
      return memoryDB.updateUser(id, updateData);
    }
    
    try {
      const allowedFields = [
        'nickname', 'avatar_url', 'gender', 'phone', 'email',
        'school_id', 'school_name', 'student_id', 'dormitory',
        'last_location'
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
        return await this.findById(id);
      }

      values.push(id);

      const result = await query(
        `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      return result.rows[0];
    } catch (error) {
      console.log('PostgreSQL更新失败，使用内存数据库');
      return memoryDB.updateUser(id, updateData);
    }
  }

  /**
   * 更新用户最后登录时间
   */
  static async updateLastLogin(id) {
    if (useMemoryDB) {
      return memoryDB.updateUser(id, { last_login_at: new Date() });
    }
    
    try {
      const result = await query(
        `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.log('PostgreSQL更新失败，使用内存数据库');
      return memoryDB.updateUser(id, { last_login_at: new Date() });
    }
  }

  /**
   * 获取用户统计信息
   */
  static async getStats(userId) {
    // 内存数据库简化实现
    const items = Array.from(memoryDB.items.values()).filter(i => i.user_id === userId);
    const exchanges = Array.from(memoryDB.exchanges.values()).filter(
      e => e.requester_id === userId || e.owner_id === userId
    );

    return {
      total_items: items.length,
      active_items: items.filter(i => i.status === 'active').length,
      completed_exchanges: exchanges.filter(e => e.status === 'completed').length,
      rating: 5.0 // 默认评分
    };
  }
}

module.exports = User;
