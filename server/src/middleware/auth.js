const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { session } = require('../config/redis');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未提供认证token' });
    }

    const token = authHeader.substring(7);

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查session
    const sessionData = await session.get(decoded.openid);
    if (!sessionData || sessionData.token !== token) {
      return res.status(401).json({ success: false, message: 'Token已失效' });
    }

    // 获取用户信息
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });
    }

    // 将用户信息附加到请求
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    req.user = user;

    // 更新最后活跃时间
    User.updateLastActive(user.id).catch(console.error);

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '无效的token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token已过期' });
    }
    console.error('认证失败:', error);
    res.status(500).json({ success: false, message: '认证失败' });
  }
};

// 可选认证（不强制要求登录，但如果有token会解析）
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.userId = decoded.userId;
    req.openid = decoded.openid;

  } catch (error) {
    // 忽略错误，继续处理
  }
  
  next();
};
