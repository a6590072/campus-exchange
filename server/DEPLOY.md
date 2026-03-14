# 部署到 Render 指南

## 快速部署步骤

### 1. 准备工作
- 注册 Render 账号: https://render.com
- 将代码推送到 GitHub/GitLab

### 2. 在 Render 上创建服务

#### 方式一：使用 Blueprint (推荐)
1. 登录 Render Dashboard
2. 点击 "Blueprints"
3. 点击 "New Blueprint Instance"
4. 选择你的代码仓库
5. Render 会自动读取 `render.yaml` 并创建所有服务

#### 方式二：手动创建
1. 登录 Render Dashboard
2. 点击 "New +" → "Web Service"
3. 选择你的代码仓库
4. 配置如下:
   - **Name**: campus-exchange-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. 添加环境变量:
   ```
   NODE_ENV=production
   DASHSCOPE_API_KEY=sk-sp-80d30ee1dfc44b72bd7b456d110b1727
   JWT_SECRET=(自动生成或自定义)
   ```

6. 创建 PostgreSQL 数据库:
   - 点击 "New +" → "PostgreSQL"
   - Name: campus-exchange-db
   - Plan: Free

7. 创建 Redis 服务:
   - 点击 "New +" → "Redis"
   - Name: campus-exchange-redis
   - Plan: Free

### 3. 部署完成后的配置

部署成功后，Render 会提供:
- **API URL**: `https://campus-exchange-api.onrender.com` (示例)
- **数据库连接串**: 自动注入到 DATABASE_URL 环境变量
- **Redis 连接串**: 自动注入到 REDIS_URL 环境变量

### 4. 更新小程序配置

将小程序的 `app.js` 中的 `apiBaseUrl` 修改为:
```javascript
apiBaseUrl: 'https://campus-exchange-api.onrender.com/api/v1'
```

### 5. 注意事项

1. **免费版限制**:
   - 服务会在 15 分钟无活动后休眠
   - 首次访问可能需要等待 30 秒唤醒
   - 每月 750 小时运行时间

2. **数据库**:
   - 免费版 PostgreSQL 有 1GB 存储限制
   - 90 天后会过期，需要手动备份数据

3. **自定义域名** (可选):
   - 在 Render Dashboard 中可以添加自定义域名
   - 支持 HTTPS 自动配置

## 故障排查

### 服务启动失败
查看 Render Dashboard 的 Logs 标签页，检查:
- 环境变量是否正确设置
- 数据库连接是否正常
- 端口是否正确监听 (Render 使用 PORT 环境变量)

### 数据库连接问题
确保:
- DATABASE_URL 环境变量已正确设置
- 数据库服务状态为 "Available"
- SSL 配置正确 (代码已自动处理)

### API 访问问题
- 检查 CORS 配置
- 确认 API 路径正确
- 查看 Logs 中的请求日志
