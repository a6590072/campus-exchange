# 换换校园 - 校园物换物平台

一款专注于大学生物品交换的微信小程序，融合AI智能估值、智能匹配推荐等功能，让闲置物品在校园内高效流转。

## 项目架构

```
campus-exchange/
├── client/                 # 微信小程序前端
│   ├── pages/             # 页面文件
│   │   ├── index/         # 首页
│   │   ├── item/          # 物品相关
│   │   ├── user/          # 用户中心
│   │   ├── message/       # 消息中心
│   │   └── ai/            # AI功能
│   ├── app.js             # 小程序入口
│   ├── app.json           # 全局配置
│   └── app.wxss           # 全局样式
│
├── server/                # Node.js后端
│   ├── src/
│   │   ├── config/        # 配置文件
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── middleware/    # 中间件
│   │   ├── ai/            # AI服务
│   │   └── app.js         # 应用入口
│   └── package.json
│
└── docs/                  # 文档
    ├── design-system.md   # 设计系统
    └── database-schema.md # 数据库设计
```

## 核心功能

### 1. 用户系统
- 微信一键登录
- 学生身份认证
- 个人资料管理
- 信用评分体系

### 2. 物品管理
- 多图上传
- AI智能估值
- 成色评估
- 分类管理
- 位置标记

### 3. 智能匹配
- AI物品识别
- 智能推荐算法
- 匹配度评分
- 价值评估

### 4. 交易流程
- 换物请求
- 在线沟通
- 交易确认
- 评价系统

### 5. AI功能
- 物品智能估值
- 自动标签生成
- 描述优化建议
- 智能匹配推荐

## 技术栈

### 前端
- 微信小程序原生开发
- CSS变量设计系统
- 组件化架构

### 后端
- Node.js + Express
- PostgreSQL 数据库
- Redis 缓存
- JWT 认证

### AI服务
- 阿里云百炼 (Dashscope)
- 模型: kimi-k2.5
- OpenAI兼容接口

## 快速开始

### 1. 环境准备

```bash
# 安装 Node.js (推荐 v18+)
# 安装 PostgreSQL
# 安装 Redis
```

### 2. 后端启动

```bash
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库和AI配置

# 启动开发服务器
npm run dev
```

### 3. 前端启动

使用微信开发者工具打开 `client` 目录：

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择 `client` 目录
3. 在 `app.js` 中配置 API 地址
4. 点击编译运行

### 4. 数据库初始化

```sql
-- 创建数据库
createdb campus_exchange

-- 执行初始化脚本
-- 见 docs/database-schema.md
```

## 配置说明

### 后端环境变量 (.env)

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_exchange
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 微信小程序
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# AI服务 (阿里云百炼)
DASHSCOPE_API_KEY=sk-sp-80d30ee1dfc44b72bd7b456d110b1727
DASHSCOPE_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
DASHSCOPE_MODEL=kimi-k2.5
ENABLE_AI_VALUATION=true
```

### 小程序配置 (app.js)

```javascript
globalData: {
  apiBaseUrl: 'http://localhost:3000/api/v1',  // 开发环境
  // apiBaseUrl: 'https://your-domain.com/api/v1',  // 生产环境
}
```

## API 接口文档

### 认证相关
- `POST /api/v1/auth/wechat-login` - 微信登录
- `GET /api/v1/auth/me` - 获取当前用户
- `POST /api/v1/auth/logout` - 退出登录

### 物品相关
- `GET /api/v1/items` - 获取物品列表
- `POST /api/v1/items` - 发布物品
- `GET /api/v1/items/:id` - 获取物品详情
- `PUT /api/v1/items/:id` - 更新物品
- `DELETE /api/v1/items/:id` - 删除物品
- `GET /api/v1/items/recommendations` - 获取推荐
- `POST /api/v1/items/:id/favorite` - 收藏/取消收藏

### AI相关
- `POST /api/v1/ai/valuation` - AI估值

## 部署指南

### 后端部署

1. 准备服务器 (推荐 Ubuntu 20.04+)
2. 安装 Node.js、PostgreSQL、Redis
3. 配置 Nginx 反向代理
4. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name campus-exchange

# 保存配置
pm2 save
pm2 startup
```

### 小程序部署

1. 在微信公众平台注册小程序
2. 配置服务器域名 (request、socket、upload/download)
3. 上传代码并提交审核
4. 配置业务域名和服务器域名

## 开发规范

### 代码规范
- ESLint 代码检查
- 统一使用 async/await
- RESTful API 设计
- 统一的响应格式

### Git 规范
- main: 主分支
- develop: 开发分支
- feature/*: 功能分支
- hotfix/*: 修复分支

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- 邮箱: support@huanhuan-campus.com
- 微信: huanhuan-campus

---

**换换校园** - 让闲置物品流动起来 🔄
