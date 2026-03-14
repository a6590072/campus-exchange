const { query } = require('../config/database');
const path = require('path');
const fs = require('fs');

// 认证文件存储目录
const verificationDir = path.join(__dirname, '../../uploads/verification');

// 确保目录存在
if (!fs.existsSync(verificationDir)) {
  fs.mkdirSync(verificationDir, { recursive: true });
}

/**
 * 提交学生认证
 */
exports.submitVerification = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      school_name,
      student_id,
      real_name,
      id_card,
      phone
    } = req.body;

    // 验证必填字段
    if (!school_name || !student_id || !real_name) {
      return res.status(400).json({
        success: false,
        message: '学校名称、学号和真实姓名为必填项'
      });
    }

    // 检查是否已提交过认证
    const existingResult = await query(
      'SELECT id, status FROM student_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message: '您已提交认证申请，请等待审核'
        });
      }
      if (existing.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: '您已通过认证，无需重复提交'
        });
      }
    }

    // 处理上传的文件
    let id_card_image = null;
    let student_card_image = null;

    if (req.files) {
      if (req.files.id_card_image) {
        id_card_image = `/uploads/verification/${req.files.id_card_image[0].filename}`;
      }
      if (req.files.student_card_image) {
        student_card_image = `/uploads/verification/${req.files.student_card_image[0].filename}`;
      }
    }

    // 创建认证申请
    const result = await query(
      `INSERT INTO student_verifications (
        user_id, school_name, student_id, real_name,
        id_card, phone, id_card_image, student_card_image,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *`,
      [userId, school_name, student_id, real_name, id_card, phone, id_card_image, student_card_image]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: '认证申请已提交，请等待审核'
    });
  } catch (error) {
    console.error('提交认证失败:', error);
    res.status(500).json({
      success: false,
      message: '提交认证失败'
    });
  }
};

/**
 * 获取认证状态
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT v.*, u.is_verified, u.school_name as user_school_name, u.student_id as user_student_id
       FROM student_verifications v
       RIGHT JOIN users u ON v.user_id = u.id
       WHERE u.id = $1
       ORDER BY v.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const data = result.rows[0];

    res.json({
      success: true,
      data: {
        is_verified: data.is_verified,
        school_name: data.user_school_name,
        student_id: data.user_student_id,
        last_application: data.id ? {
          id: data.id,
          status: data.status,
          submitted_at: data.created_at,
          reviewed_at: data.reviewed_at,
          review_note: data.review_note
        } : null
      }
    });
  } catch (error) {
    console.error('获取认证状态失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证状态失败'
    });
  }
};

/**
 * 获取认证历史
 */
exports.getVerificationHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT id, school_name, student_id, real_name, status,
              created_at, reviewed_at, review_note
       FROM student_verifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('获取认证历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证历史失败'
    });
  }
};

// ========== 管理员接口 ==========

/**
 * 获取待审核列表（管理员）
 */
exports.getPendingVerifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT v.*, u.nickname, u.avatar_url, u.created_at as user_created_at
       FROM student_verifications v
       JOIN users u ON v.user_id = u.id
       WHERE v.status = 'pending'
       ORDER BY v.created_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM student_verifications WHERE status = \'pending\''
    );

    res.json({
      success: true,
      data: {
        list: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total)
        }
      }
    });
  } catch (error) {
    console.error('获取待审核列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取待审核列表失败'
    });
  }
};

/**
 * 审核认证（管理员）
 */
exports.reviewVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '审核状态必须是 approved 或 rejected'
      });
    }

    // 获取认证申请
    const verificationResult = await query(
      'SELECT * FROM student_verifications WHERE id = $1',
      [id]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '认证申请不存在'
      });
    }

    const verification = verificationResult.rows[0];

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该申请已审核过'
      });
    }

    // 更新认证状态
    await query(
      `UPDATE student_verifications 
       SET status = $1, review_note = $2, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [status, review_note || null, id]
    );

    // 如果通过，更新用户认证状态
    if (status === 'approved') {
      await query(
        `UPDATE users 
         SET is_verified = true, 
             school_name = $1, 
             student_id = $2,
             verified_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [verification.school_name, verification.student_id, verification.user_id]
      );
    }

    res.json({
      success: true,
      message: status === 'approved' ? '已通过认证' : '已拒绝认证'
    });
  } catch (error) {
    console.error('审核认证失败:', error);
    res.status(500).json({
      success: false,
      message: '审核认证失败'
    });
  }
};

/**
 * 获取认证统计（管理员）
 */
exports.getVerificationStats = async (req, res) => {
  try {
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
       FROM student_verifications`
    );

    const userStatsResult = await query(
      `SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_users
       FROM users`
    );

    res.json({
      success: true,
      data: {
        applications: statsResult.rows[0],
        users: userStatsResult.rows[0]
      }
    });
  } catch (error) {
    console.error('获取认证统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取认证统计失败'
    });
  }
};
