require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
const fs = require('fs');

const routes = require('./routes');
const { query } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// 获取本机 IP 地址（优先使用 WLAN 网络）
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let wlanIP = null;
  let otherIP = null;

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部地址和非 IPv4 地址
      if (iface.family === 'IPv4' && !iface.internal) {
        // 优先使用 WLAN 网络的 IP
        if (name.toLowerCase().includes('wlan') || name.toLowerCase().includes('wi-fi')) {
          wlanIP = iface.address;
        } else if (!otherIP && !name.toLowerCase().includes('wsl') && !name.toLowerCase().includes('hyper-v')) {
          otherIP = iface.address;
        }
      }
    }
  }

  return wlanIP || otherIP || 'localhost';
}

const LOCAL_IP = getLocalIP();

// 安全中间件
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 压缩
app.use(compression());

// 日志
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' }
});
app.use(limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 上传的图片
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API路由
app.use(API_PREFIX, routes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: '接口不存在' 
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 初始化数据库
async function initDatabase() {
  try {
    console.log('🔄 检查数据库初始化...');
    
    // 检查 items 表是否存在
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'items'
      ) as exists;
    `);
    
    // 安全地检查 exists 属性
    const tableExists = checkResult && checkResult.rows && checkResult.rows[0] && checkResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('📊 数据库表不存在，开始初始化...');
      
      // 读取并执行 SQL 文件
      const sqlPath = path.join(__dirname, 'database/schema.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await query(sql);
        console.log('✅ 数据库初始化完成！');
      } else {
        console.log('⚠️ schema.sql 文件不存在，跳过初始化');
      }
    } else {
      console.log('✅ 数据库已初始化');
    }
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    // 不阻止服务器启动
  }
}

// 启动服务器 - 监听所有网络接口
app.listen(PORT, '0.0.0.0', async () => {
  // 初始化数据库
  await initDatabase();
  
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     🎓 物的第二站 - 校园物换物平台                      ║
║                                                        ║
║     服务器启动成功！                                    ║
║     端口: ${PORT}                                    ║
║     环境: ${process.env.NODE_ENV || 'development'}                    ║
║     API: http://${LOCAL_IP}:${PORT}${API_PREFIX}      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
