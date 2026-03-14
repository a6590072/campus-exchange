# 换换校园 - 数据库设计文档

## 数据库选型
- **主数据库**: PostgreSQL 14+ (关系型数据)
- **缓存**: Redis 7+ (会话、热点数据)
- **文件存储**: 阿里云OSS (图片存储)
- **搜索引擎**: Elasticsearch (物品搜索)

## 核心数据表结构

### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
    unionid VARCHAR(100) COMMENT '微信unionid',
    
    -- 学生认证信息
    student_id VARCHAR(50) COMMENT '学号',
    real_name VARCHAR(50) COMMENT '真实姓名',
    id_card VARCHAR(18) COMMENT '身份证号(加密存储)',
    
    -- 学校信息
    school_id BIGINT REFERENCES schools(id),
    department VARCHAR(100) COMMENT '院系',
    major VARCHAR(100) COMMENT '专业',
    grade SMALLINT COMMENT '年级(1-4)',
    
    -- 个人信息
    nickname VARCHAR(50) NOT NULL DEFAULT '',
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    gender SMALLINT DEFAULT 0 COMMENT '0未知 1男 2女',
    birthday DATE,
    bio TEXT COMMENT '个人简介',
    
    -- 位置信息
    dormitory VARCHAR(100) COMMENT '宿舍楼',
    last_location GEOGRAPHY(POINT) COMMENT '最后位置',
    
    -- 信用体系
    credit_score INTEGER DEFAULT 80 COMMENT '信用分0-100',
    credit_level VARCHAR(20) DEFAULT 'bronze' COMMENT 'bronze/silver/gold/platinum/diamond',
    transaction_count INTEGER DEFAULT 0 COMMENT '成功交易数',
    rating DECIMAL(2,1) DEFAULT 5.0 COMMENT '平均评分',
    rating_count INTEGER DEFAULT 0 COMMENT '被评价次数',
    
    -- 账户状态
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active/blocked/deleted',
    is_verified BOOLEAN DEFAULT FALSE COMMENT '是否认证',
    verified_at TIMESTAMP,
    
    -- 偏好设置
    preferences JSONB DEFAULT '{}' COMMENT '用户偏好标签',
    notification_settings JSONB DEFAULT '{
        "new_match": true,
        "message": true,
        "exchange_update": true,
        "system": true
    }',
    
    -- 统计字段
    item_count INTEGER DEFAULT 0 COMMENT '发布物品数',
    exchange_count INTEGER DEFAULT 0 COMMENT '交换次数',
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    
    -- 时间戳
    last_login_at TIMESTAMP,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_school ON users(school_id);
CREATE INDEX idx_users_credit ON users(credit_score DESC);
CREATE INDEX idx_users_location ON users USING GIST(last_location);
```

### 2. 学校表 (schools)
```sql
CREATE TABLE schools (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '学校名称',
    code VARCHAR(50) UNIQUE COMMENT '学校代码',
    short_name VARCHAR(50) COMMENT '简称',
    
    -- 地理位置
    province VARCHAR(50) COMMENT '省份',
    city VARCHAR(50) COMMENT '城市',
    district VARCHAR(50) COMMENT '区县',
    address TEXT,
    location GEOGRAPHY(POINT) COMMENT '经纬度',
    
    -- 学校信息
    type VARCHAR(20) COMMENT '类型：本科/专科/研究生',
    level VARCHAR(20) COMMENT '级别：985/211/普通',
    student_count INTEGER COMMENT '学生数量估算',
    
    -- 交易配置
    trade_settings JSONB DEFAULT '{
        "enabled": true,
        "trade_points": ["图书馆", "食堂", "宿舍区"],
        "default_radius": 5000
    }',
    
    -- 统计
    user_count INTEGER DEFAULT 0,
    item_count INTEGER DEFAULT 0,
    exchange_count INTEGER DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schools_location ON schools USING GIST(location);
```

### 3. 物品表 (items)
```sql
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基本信息
    title VARCHAR(200) NOT NULL COMMENT '标题',
    description TEXT COMMENT '详细描述',
    
    -- 分类信息
    category_id INTEGER REFERENCES categories(id),
    category_path VARCHAR(200) COMMENT '分类路径，如：电子/手机',
    
    -- 物品状态
    condition_level VARCHAR(20) COMMENT '全新/99新/9成新/8成新/7成新以下',
    condition_description TEXT COMMENT '成色描述',
    condition_ai_score DECIMAL(3,2) COMMENT 'AI评估成色分0-1',
    
    -- 价格信息
    original_price DECIMAL(10,2) COMMENT '原价',
    estimated_value_min DECIMAL(10,2) COMMENT '估值下限',
    estimated_value_max DECIMAL(10,2) COMMENT '估值上限',
    estimated_value_ai DECIMAL(10,2) COMMENT 'AI建议估值',
    
    -- 图片
    images JSONB NOT NULL DEFAULT '[]' COMMENT '图片URL数组',
    cover_image VARCHAR(500) COMMENT '封面图',
    
    -- 交换设置
    exchange_type VARCHAR(20) DEFAULT 'any' COMMENT 'any(任意)/specific(指定)/cash(可出售)',
    want_categories JSONB DEFAULT '[]' COMMENT '想要交换的分类',
    want_description TEXT COMMENT '想要交换的描述',
    want_items JSONB DEFAULT '[]' COMMENT '指定想要的物品ID',
    cash_acceptable BOOLEAN DEFAULT TRUE COMMENT '是否接受现金补差',
    cash_adjustment_range JSONB DEFAULT '{"min": 0, "max": null}' COMMENT '可接受补差范围',
    
    -- 位置
    location GEOGRAPHY(POINT) COMMENT '物品位置',
    location_name VARCHAR(200) COMMENT '位置名称',
    school_id BIGINT REFERENCES schools(id),
    
    -- 状态
    status VARCHAR(20) DEFAULT 'available' COMMENT 'available/exchanging/completed/offline/deleted',
    
    -- AI标签
    ai_tags JSONB DEFAULT '[]' COMMENT 'AI识别的标签',
    ai_description TEXT COMMENT 'AI生成的描述',
    ai_features JSONB DEFAULT '{}' COMMENT 'AI提取的特征',
    
    -- 统计
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0 COMMENT '询价次数',
    
    -- 时间
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refreshed_at TIMESTAMP COMMENT '刷新时间',
    expires_at TIMESTAMP COMMENT '过期时间',
    completed_at TIMESTAMP COMMENT '成交时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_school ON items(school_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_location ON items USING GIST(location);
CREATE INDEX idx_items_created ON items(created_at DESC);
CREATE INDEX idx_items_value ON items(estimated_value_ai);

-- 全文搜索索引
CREATE INDEX idx_items_search ON items USING GIN(to_tsvector('chinese', title || ' ' || COALESCE(description, '')));
```

### 4. 分类表 (categories)
```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id),
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    icon VARCHAR(100) COMMENT '图标',
    sort_order INTEGER DEFAULT 0 COMMENT '排序',
    
    -- 估值参数
    valuation_params JSONB DEFAULT '{}' COMMENT '估值相关参数',
    
    -- 统计
    item_count INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化分类数据
INSERT INTO categories (id, parent_id, name, icon, sort_order) VALUES
(1, NULL, '数码电子', 'electronics', 1),
(2, 1, '手机', 'phone', 1),
(3, 1, '电脑', 'computer', 2),
(4, 1, '平板', 'tablet', 3),
(5, 1, '配件', 'accessory', 4),
(6, NULL, '书籍教材', 'book', 2),
(7, 6, '教材', 'textbook', 1),
(8, 6, '考试用书', 'exam', 2),
(9, 6, '小说文学', 'novel', 3),
(10, 6, '其他书籍', 'other-book', 4),
(11, NULL, '生活用品', 'daily', 3),
(12, 11, '家具', 'furniture', 1),
(13, 11, '电器', 'appliance', 2),
(14, 11, '收纳', 'storage', 3),
(15, 11, '其他', 'other-daily', 4),
(16, NULL, '服饰鞋包', 'clothing', 4),
(17, NULL, '美妆护肤', 'beauty', 5),
(18, NULL, '运动户外', 'sports', 6),
(19, NULL, ' tickets卡券', 'ticket', 7),
(20, NULL, '其他', 'others', 8);
```

### 5. 交换表 (exchanges)
```sql
CREATE TABLE exchanges (
    id BIGSERIAL PRIMARY KEY,
    
    -- 交换类型
    type VARCHAR(20) DEFAULT '1v1' COMMENT '1v1/1vn/nv1/chain(链式)',
    
    -- 交换状态
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending/negotiating/confirmed/exchanging/completed/cancelled/disputed',
    
    -- 发起人
    initiator_id BIGINT NOT NULL REFERENCES users(id),
    
    -- 参与方信息 (JSONB存储多方信息)
    parties JSONB NOT NULL DEFAULT '[]' COMMENT '[
        {
            "user_id": 1,
            "items": [1, 2],
            "cash_adjustment": 100.00,
            "confirmed": true,
            "confirmed_at": "2024-01-01T10:00:00"
        }
    ]',
    
    -- 物品信息
    item_ids INTEGER[] NOT NULL COMMENT '涉及的所有物品ID',
    
    -- 价值信息
    total_value_a DECIMAL(10,2) COMMENT 'A方物品总价值',
    total_value_b DECIMAL(10,2) COMMENT 'B方物品总价值',
    cash_difference DECIMAL(10,2) DEFAULT 0 COMMENT '现金补差',
    
    -- 交易地点
    meeting_point VARCHAR(200) COMMENT '交易地点',
    meeting_location GEOGRAPHY(POINT) COMMENT '交易位置',
    meeting_time TIMESTAMP COMMENT '约定时间',
    
    -- 担保交易
    escrow_status VARCHAR(20) DEFAULT 'none' COMMENT 'none/pending/held/released/refunded',
    escrow_amount DECIMAL(10,2) DEFAULT 0 COMMENT '托管金额',
    
    -- 聊天室
    chat_room_id VARCHAR(100) COMMENT '关联聊天室ID',
    
    -- 评价
    ratings JSONB DEFAULT '[]' COMMENT '双方评价',
    
    -- 时间线
    timeline JSONB DEFAULT '[]' COMMENT '操作时间线',
    
    -- 取消/纠纷
    cancelled_by BIGINT REFERENCES users(id),
    cancel_reason TEXT,
    dispute_reason TEXT,
    dispute_resolved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_exchanges_initiator ON exchanges(initiator_id);
CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_exchanges_created ON exchanges(created_at DESC);
```

### 6. 收藏表 (favorites)
```sql
CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_id);
```

### 7. 浏览记录表 (view_history)
```sql
CREATE TABLE view_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 1,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_view_history_user ON view_history(user_id);
CREATE INDEX idx_view_history_item ON view_history(item_id);
```

### 8. 消息表 (messages)
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    
    -- 会话
    conversation_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    
    -- 发送方
    sender_id BIGINT NOT NULL REFERENCES users(id),
    sender_type VARCHAR(20) DEFAULT 'user' COMMENT 'user/system',
    
    -- 接收方
    receiver_id BIGINT NOT NULL REFERENCES users(id),
    
    -- 消息内容
    msg_type VARCHAR(20) DEFAULT 'text' COMMENT 'text/image/item/exchange/system',
    content TEXT COMMENT '文本内容',
    media_url VARCHAR(500) COMMENT '媒体URL',
    extra_data JSONB DEFAULT '{}' COMMENT '附加数据',
    
    -- 状态
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- 撤回
    is_recalled BOOLEAN DEFAULT FALSE,
    recalled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

### 9. 会话表 (conversations)
```sql
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    conversation_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- 参与人
    participant_ids BIGINT[] NOT NULL COMMENT '参与人ID数组',
    
    -- 关联
    related_item_id BIGINT REFERENCES items(id),
    related_exchange_id BIGINT REFERENCES exchanges(id),
    
    -- 最后消息
    last_message_id BIGINT REFERENCES messages(id),
    last_message_at TIMESTAMP,
    
    -- 未读数
    unread_count JSONB DEFAULT '{}' COMMENT '{user_id: count}',
    
    -- 状态
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

### 10. 评价表 (ratings)
```sql
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    
    exchange_id BIGINT NOT NULL REFERENCES exchanges(id),
    rater_id BIGINT NOT NULL REFERENCES users(id) COMMENT '评价人',
    ratee_id BIGINT NOT NULL REFERENCES users(id) COMMENT '被评价人',
    
    -- 评分
    overall_rating SMALLINT NOT NULL COMMENT '总体评分1-5',
    item_match_rating SMALLINT COMMENT '物品描述准确度',
    attitude_rating SMALLINT COMMENT '交易态度',
    punctuality_rating SMALLINT COMMENT '守时程度',
    
    -- 评价内容
    content TEXT COMMENT '文字评价',
    tags JSONB DEFAULT '[]' COMMENT '评价标签',
    
    -- 是否匿名
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- 回复
    reply_content TEXT,
    reply_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(exchange_id, rater_id)
);

CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX idx_ratings_exchange ON ratings(exchange_id);
```

### 11. 系统配置表 (system_configs)
```sql
CREATE TABLE system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化配置
INSERT INTO system_configs (config_key, config_value, description) VALUES
('credit_rules', '{
    "initial_score": 80,
    "max_score": 100,
    "min_score": 0,
    "transaction_success": 2,
    "transaction_cancel": -5,
    "good_rating": 1,
    "bad_rating": -3,
    "report_confirmed": -20
}', '信用分规则'),

('exchange_settings', '{
    "escrow_enabled": true,
    "escrow_fee_rate": 0.01,
    "max_cash_difference": 1000,
    "auto_cancel_hours": 72,
    "confirm_timeout_hours": 24
}', '交换设置'),

('ai_settings', '{
    "valuation_enabled": true,
    "match_enabled": true,
    "description_generation": true,
    "tag_extraction": true
}', 'AI功能开关');
```

### 12. 操作日志表 (operation_logs)
```sql
CREATE TABLE operation_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    target_type VARCHAR(50) COMMENT '操作对象类型',
    target_id BIGINT COMMENT '操作对象ID',
    details JSONB DEFAULT '{}' COMMENT '操作详情',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_user ON operation_logs(user_id);
CREATE INDEX idx_logs_action ON operation_logs(action);
CREATE INDEX idx_logs_created ON operation_logs(created_at);
```

## Redis 数据结构

### 1. 用户会话
```
Key: session:{openid}
Value: JSON {user_id, token, expires_at}
TTL: 7天
```

### 2. 验证码
```
Key: verify_code:{phone}
Value: "123456"
TTL: 5分钟
```

### 3. 物品热度排行
```
Key: hot_items:{school_id}
Type: Sorted Set
Score: 热度分 = view_count * 1 + like_count * 3 + favorite_count * 5
Member: item_id
```

### 4. 用户推荐池
```
Key: recommend:{user_id}
Type: List
Value: [item_id1, item_id2, ...]
TTL: 1小时
```

### 5. 消息未读数
```
Key: unread:{user_id}
Type: Hash
Field: conversation_id
Value: 未读数量
```

### 6. 限流计数
```
Key: rate_limit:{action}:{user_id}
Type: String
Value: 计数
TTL: 1分钟
```

## 数据库迁移脚本

```sql
-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用到所有表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchanges_updated_at BEFORE UPDATE ON exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
