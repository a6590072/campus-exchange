-- ============================================
-- 物的第二站 - 数据库表结构
-- 校园物品交换平台
-- ============================================

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS exchange_messages CASCADE;
DROP TABLE IF EXISTS exchange_requests CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. 用户表
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    openid VARCHAR(100) UNIQUE NOT NULL,
    unionid VARCHAR(100),
    nickname VARCHAR(100) NOT NULL DEFAULT '用户',
    avatar_url TEXT,
    gender SMALLINT DEFAULT 0, -- 0:未知, 1:男, 2:女
    phone VARCHAR(20),
    email VARCHAR(100),
    
    -- 学校信息
    school_id INTEGER,
    school_name VARCHAR(100),
    student_id VARCHAR(50), -- 学号
    is_verified BOOLEAN DEFAULT FALSE, -- 学生认证状态
    verified_at TIMESTAMP,
    
    -- 位置信息
    dormitory VARCHAR(100), -- 宿舍/楼栋
    last_location JSONB, -- {latitude, longitude, name}
    
    -- 信用体系
    credit_score INTEGER DEFAULT 100,
    exchange_count INTEGER DEFAULT 0,
    publish_count INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active', -- active, banned, deleted
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_school ON users(school_id);

-- ============================================
-- 2. 分类表
-- ============================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20),
    sort_order INTEGER DEFAULT 0,
    parent_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. 物品表
-- ============================================
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基本信息
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    
    -- 成色信息
    condition_level VARCHAR(20), -- 全新, 99新, 9成新, 8成新, 7成新及以下
    condition_description TEXT,
    
    -- 价值信息
    original_price DECIMAL(10, 2),
    estimated_value_min DECIMAL(10, 2),
    estimated_value_max DECIMAL(10, 2),
    estimated_value_ai DECIMAL(10, 2),
    
    -- 图片
    images TEXT[], -- 图片URL数组
    cover_image TEXT,
    
    -- 交换设置
    exchange_type VARCHAR(20) DEFAULT 'any', -- any:任意换, specific:指定换
    want_description TEXT, -- 想换什么
    want_category_ids INTEGER[], -- 想换的分类
    cash_acceptable BOOLEAN DEFAULT FALSE, -- 是否接受补差价
    cash_adjustment_range JSONB, -- {min, max}
    
    -- 位置
    location JSONB, -- {latitude, longitude}
    location_name VARCHAR(100),
    
    -- AI分析
    ai_tags TEXT[],
    ai_description TEXT,
    ai_features JSONB, -- {brand, model, conditionScore}
    
    -- 统计
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    exchange_request_count INTEGER DEFAULT 0,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active', -- active:可交换, pending:审核中, exchanged:已交换, deleted:已删除
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exchanged_at TIMESTAMP -- 交换完成时间
);

-- 物品表索引
CREATE INDEX idx_items_owner ON items(owner_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_created ON items(created_at DESC);
CREATE INDEX idx_items_location ON items USING GIN(location);

-- ============================================
-- 4. 收藏表
-- ============================================
CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_item ON favorites(item_id);

-- ============================================
-- 5. 交换请求表
-- ============================================
CREATE TABLE exchange_requests (
    id SERIAL PRIMARY KEY,
    
    -- 双方信息
    requester_id INTEGER NOT NULL REFERENCES users(id), -- 发起方
    target_id INTEGER NOT NULL REFERENCES users(id), -- 目标方
    
    -- 物品信息
    requester_item_id INTEGER REFERENCES items(id), -- 发起方提供的物品（可为空）
    target_item_id INTEGER NOT NULL REFERENCES items(id), -- 目标物品
    
    -- 交换详情
    message TEXT, -- 留言
    cash_offer DECIMAL(10, 2) DEFAULT 0, -- 补差价金额
    
    -- 状态流转
    status VARCHAR(20) DEFAULT 'pending', -- pending:待确认, accepted:已接受, rejected:已拒绝, completed:已完成, cancelled:已取消
    
    -- 时间记录
    responded_at TIMESTAMP, -- 响应时间
    completed_at TIMESTAMP, -- 完成时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exchange_requester ON exchange_requests(requester_id);
CREATE INDEX idx_exchange_target ON exchange_requests(target_id);
CREATE INDEX idx_exchange_status ON exchange_requests(status);
CREATE INDEX idx_exchange_items ON exchange_requests(requester_item_id, target_item_id);

-- ============================================
-- 6. 交换消息表（用于沟通）
-- ============================================
CREATE TABLE exchange_messages (
    id SERIAL PRIMARY KEY,
    exchange_id INTEGER NOT NULL REFERENCES exchange_requests(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- text, image, location
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_exchange ON exchange_messages(exchange_id);
CREATE INDEX idx_messages_sender ON exchange_messages(sender_id);
CREATE INDEX idx_messages_created ON exchange_messages(created_at);

-- ============================================
-- 7. 浏览记录表（用于推荐）
-- ============================================
CREATE TABLE view_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 1,
    last_viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);

CREATE INDEX idx_view_history_user ON view_history(user_id);
CREATE INDEX idx_view_history_item ON view_history(item_id);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_requests_updated_at BEFORE UPDATE ON exchange_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初始化数据：分类
-- ============================================
INSERT INTO categories (name, icon, color, sort_order) VALUES
('数码电子', '📱', '#EEF2FF', 1),
('图书教材', '📚', '#F0FDF4', 2),
('服饰鞋包', '👕', '#FDF2F8', 3),
('运动户外', '⚽', '#FEF3C7', 4),
('生活用品', '🏠', '#ECFDF5', 5),
('美妆护肤', '💄', '#FCE7F3', 6),
('票券卡券', '🎫', '#DBEAFE', 7),
('其他物品', '📦', '#F3F4F6', 8),
('免费送', '🎁', '#FEF9C3', 9);

-- ============================================
-- 初始化数据：测试用户
-- ============================================
INSERT INTO users (openid, nickname, avatar_url, credit_score, status) VALUES
('test_openid_1', '测试用户1', '', 100, 'active'),
('test_openid_2', '测试用户2', '', 100, 'active');

-- ============================================
-- 初始化数据：测试物品
-- ============================================
INSERT INTO items (
    owner_id, title, description, category_id,
    condition_level, condition_description,
    original_price, estimated_value_ai,
    images, cover_image,
    exchange_type, want_description,
    location_name, status
) VALUES
(
    1, 'iPad Air 4', '2021年购买，保护得很好，带原装充电器', 1,
    '95新', '屏幕无划痕，边框轻微使用痕迹',
    4500, 2800,
    ARRAY['https://picsum.photos/400/400?random=1'], 'https://picsum.photos/400/400?random=1',
    'any', '想换笔记本电脑或相机',
    '校内交易', 'active'
),
(
    2, '高等数学教材', '同济版高数上下册，笔记详细', 2,
    '8成新', '有笔记和重点标记',
    80, 25,
    ARRAY['https://picsum.photos/400/400?random=2'], 'https://picsum.photos/400/400?random=2',
    'specific', '想换英语四六级资料',
    '图书馆', 'active'
);

-- 更新用户发布数量
UPDATE users SET publish_count = 1 WHERE id IN (1, 2);
