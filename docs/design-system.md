# 换换校园 - 设计系统规范

## 1. 品牌色彩系统

### 主色调
```
Primary: #6366F1 (靛蓝紫) - 代表信任、年轻、科技感
Primary-Light: #818CF8
Primary-Dark: #4F46E5
```

### 辅助色
```
Secondary: #10B981 (翠绿) - 代表环保、交换、成功
Secondary-Light: #34D399
Secondary-Dark: #059669
```

### 中性色
```
Background: #F8FAFC (极浅灰背景)
Surface: #FFFFFF (纯白卡片)
Border: #E2E8F0 (边框灰)
Text-Primary: #1E293B (主文字)
Text-Secondary: #64748B (次要文字)
Text-Tertiary: #94A3B8 (辅助文字)
```

### 功能色
```
Success: #22C55E
Warning: #F59E0B
Error: #EF4444
Info: #3B82F6
```

## 2. 字体系统

### 字体家族
```
中文：PingFang SC, Microsoft YaHei, sans-serif
英文/数字：Inter, SF Pro Display, -apple-system
```

### 字号规范
```
Title-1: 32rpx, Bold, line-height 1.4      // 页面大标题
Title-2: 28rpx, Bold, line-height 1.4      // 卡片标题
Title-3: 26rpx, Semibold, line-height 1.4  // 小标题
Body: 28rpx, Regular, line-height 1.6      // 正文
Body-Small: 26rpx, Regular, line-height 1.5 // 小正文
Caption: 24rpx, Regular, line-height 1.4   // 辅助文字
Tag: 22rpx, Medium, line-height 1.3        // 标签文字
```

## 3. 间距系统

### 基础单位：8rpx
```
space-1: 8rpx
space-2: 16rpx
space-3: 24rpx
space-4: 32rpx
space-5: 40rpx
space-6: 48rpx
space-8: 64rpx
space-10: 80rpx
```

### 页面边距
```
Page-Horizontal: 32rpx (左右边距)
Section-Gap: 24rpx (模块间距)
Card-Padding: 24rpx (卡片内边距)
```

## 4. 圆角系统
```
Radius-Small: 8rpx   // 标签、小按钮
Radius-Medium: 16rpx // 卡片、输入框
Radius-Large: 24rpx  // 大卡片、弹窗
Radius-XL: 32rpx     // 特殊卡片
Radius-Full: 9999rpx // 胶囊按钮、头像
```

## 5. 阴影系统
```
Shadow-Small: 0 2rpx 8rpx rgba(0,0,0,0.06)
Shadow-Medium: 0 4rpx 16rpx rgba(0,0,0,0.08)
Shadow-Large: 0 8rpx 32rpx rgba(0,0,0,0.12)
```

## 6. 组件规范

### 按钮
```
Primary Button:
- Height: 88rpx
- Background: Primary
- Color: White
- Border-radius: Radius-Large
- Font-size: 28rpx, Medium

Secondary Button:
- Height: 88rpx
- Background: White
- Border: 2rpx solid Primary
- Color: Primary
- Border-radius: Radius-Large

Ghost Button:
- Height: 72rpx
- Background: Transparent
- Color: Primary
```

### 卡片
```
Item Card:
- Background: Surface
- Border-radius: Radius-Large
- Shadow: Shadow-Medium
- Padding: 0 (图片区域) + 24rpx (内容区域)

User Card:
- Background: Surface
- Border-radius: Radius-Medium
- Border: 1rpx solid Border
- Padding: 24rpx
```

### 输入框
```
Input:
- Height: 88rpx
- Background: Background
- Border-radius: Radius-Medium
- Padding: 0 24rpx
- Font-size: 28rpx

Textarea:
- Min-height: 200rpx
- Background: Background
- Border-radius: Radius-Medium
- Padding: 24rpx
```

### 标签
```
Tag:
- Height: 44rpx
- Padding: 0 20rpx
- Border-radius: Radius-Full
- Font-size: 22rpx
- Background: Primary-Light (opacity 0.1)
- Color: Primary
```

## 7. 图标规范
```
Size-Small: 32rpx
Size-Medium: 40rpx
Size-Large: 48rpx
Size-XL: 64rpx

Stroke-Width: 2rpx
Color: 跟随文字颜色
```

## 8. 动画规范
```
Duration-Fast: 200ms
Duration-Normal: 300ms
Duration-Slow: 500ms

Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

## 9. 页面布局规范

### 顶部导航
```
Height: 88rpx
Background: Surface
Border-bottom: 1rpx solid Border
Title: 32rpx, Bold, Center
```

### 底部导航
```
Height: 100rpx + safe-area-inset-bottom
Background: Surface
Border-top: 1rpx solid Border
Icon-Size: 48rpx
Text-Size: 22rpx
Active-Color: Primary
Inactive-Color: Text-Tertiary
```

### Tab栏
```
Height: 80rpx
Background: Surface
Active-Indicator: 4rpx height, Primary color
```

## 10. 响应式断点
```
Mobile: 375rpx - 750rpx (小程序标准)
```
