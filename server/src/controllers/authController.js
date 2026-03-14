const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { session } = require('../config/redis');

// 开发模式标志
const isDevMode = process.env.NODE_ENV === 'development';
const isMockWechat = isDevMode && (!process.env.WECHAT_APPID || process.env.WECHAT_APPID === 'wx_test_appid');

/**
 * 微信小程序登录
 */
exports.wechatLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '缺少code参数' });
    }

    let openid, session_key;

    if (isMockWechat) {
      // 开发模式：模拟微信登录
      console.log('开发模式：使用模拟微信登录');
      openid = `mock_openid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      session_key = 'mock_session_key';
    } else {
      // 生产模式：调用微信接口
      const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: process.env.WECHAT_APPID,
          secret: process.env.WECHAT_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        }
      });

      const wxData = wxResponse.data;
      openid = wxData.openid;
      session_key = wxData.session_key;

      if (!openid) {
        return res.status(400).json({ 
          success: false, 
          message: '微信登录失败',
          error: wxData
        });
      }
    }

    // 查找或创建用户
    let user = await User.findByOpenid(openid);
    let isNewUser = false;

    if (!user) {
      // 新用户注册
      const newUserData = {
        openid,
        unionid: null,
        nickname: userInfo?.nickName || `用户${openid.slice(-6)}`,
        avatar_url: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0
      };

      user = await User.create(newUserData);
      isNewUser = true;
      console.log('新用户注册:', user.id);
    } else {
      // 更新用户信息
      if (userInfo) {
        await User.update(user.id, {
          nickname: userInfo.nickName || user.nickname,
          avatar_url: userInfo.avatarUrl || user.avatar_url,
          gender: userInfo.gender || user.gender
        });
        user = await User.findById(user.id);
      }
      await User.updateLastLogin(user.id);
      console.log('用户登录:', user.id);
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, openid: user.openid },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 保存session
    await session.set(openid, {
      userId: user.id,
      token,
      sessionKey: session_key,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      data: {
        token,
        user: User.toJSON(user),
        isNewUser,
        isVerified: user.is_verified
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: isDevMode ? error.message : undefined
    });
  }
};

/**
 * 获取当前用户信息
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户统计
    const stats = await User.getStats(userId);

    res.json({
      success: true,
      data: {
        ...User.toJSON(user),
        stats
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

/**
 * 更新用户信息
 */
exports.updateUserInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    const user = await User.update(userId, updateData);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在或更新失败'
      });
    }

    res.json({
      success: true,
      data: User.toJSON(user)
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
};

/**
 * 学生认证
 */
exports.verifyStudent = async (req, res) => {
  try {
    const userId = req.userId;
    const { student_id, school_id, school_name } = req.body;

    if (!student_id || !school_id) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 检查学号是否已被认证
    const existingUser = await User.findByStudentId(student_id, school_id);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        success: false,
        message: '该学号已被其他用户认证'
      });
    }

    const user = await User.verifyStudent(userId, {
      student_id,
      school_id,
      school_name
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: User.toJSON(user)
    });
  } catch (error) {
    console.error('学生认证失败:', error);
    res.status(500).json({
      success: false,
      message: '学生认证失败'
    });
  }
};

/**
 * 退出登录
 */
exports.logout = async (req, res) => {
  try {
    const { openid } = req;
    
    if (openid) {
      await session.del(openid);
    }

    res.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    res.status(500).json({
      success: false,
      message: '退出登录失败'
    });
  }
};
