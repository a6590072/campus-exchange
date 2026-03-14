const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const itemController = require('../controllers/itemController');
const uploadController = require('../controllers/uploadController');
const exchangeController = require('../controllers/exchangeController');
const messageController = require('../controllers/messageController');
const favoriteController = require('../controllers/favoriteController');
const aiController = require('../controllers/aiController');
const verificationController = require('../controllers/verificationController');
const mockController = require('../controllers/mockController');
const aiRoutes = require('./aiRoutes');
const { authenticate } = require('../middleware/auth');

// ============================================
// 公开路由
// ============================================

// 认证相关
router.post('/auth/wechat-login', authController.wechatLogin);

// Mock数据路由（用于展示，公开访问）
router.get('/mock/items', mockController.getItems);
router.get('/mock/items/:id', mockController.getItemDetail);
router.get('/mock/home', mockController.getHomeData);
router.get('/mock/user', mockController.getUserProfile);
router.get('/mock/messages', mockController.getMessages);
router.get('/mock/exchanges', mockController.getExchanges);
router.get('/mock/search', mockController.searchItems);
router.get('/mock/categories', mockController.getCategories);

// AI路由（部分公开，部分需要认证）
router.use('/ai', aiRoutes);

// AI估价预览（公开访问，无需登录）
router.post('/ai/evaluate/preview', aiController.previewEvaluation);
router.get('/ai/config', aiController.getAIConfig);

// ============================================
// 需要认证的路由
// ============================================
router.use(authenticate);

// 用户相关
router.get('/auth/me', authController.getCurrentUser);
router.post('/auth/logout', authController.logout);
router.post('/auth/verify-student', authController.verifyStudent);
router.put('/auth/profile', authController.updateUserInfo);

// 图片上传
router.post('/upload/image', 
  uploadController.uploadSingle, 
  uploadController.handleUploadError,
  uploadController.handleSingleUpload
);
router.post('/upload/images', 
  uploadController.uploadMultiple, 
  uploadController.handleUploadError,
  uploadController.handleMultipleUpload
);
router.delete('/upload/images/:filename', uploadController.deleteImage);

// 物品相关
router.get('/items', itemController.getItems);
router.post('/items', itemController.createItem);
router.get('/items/my', itemController.getMyItems);
router.get('/items/home', itemController.getHomeData);
router.get('/items/:id', itemController.getItemDetail);
router.put('/items/:id', itemController.updateItem);
router.delete('/items/:id', itemController.deleteItem);

// 交换相关
router.post('/exchanges', exchangeController.createExchange);
router.get('/exchanges/sent', exchangeController.getSentExchanges);
router.get('/exchanges/received', exchangeController.getReceivedExchanges);
router.get('/exchanges/stats', exchangeController.getExchangeStats);
router.get('/exchanges/:id', exchangeController.getExchangeDetail);
router.post('/exchanges/:id/accept', exchangeController.acceptExchange);
router.post('/exchanges/:id/reject', exchangeController.rejectExchange);
router.post('/exchanges/:id/complete', exchangeController.completeExchange);
router.post('/exchanges/:id/cancel', exchangeController.cancelExchange);

// 消息相关
router.post('/messages', messageController.sendMessage);
router.get('/messages/conversations', messageController.getConversations);
router.get('/messages/unread', messageController.getUnreadCount);
router.get('/messages/exchange/:exchange_id', messageController.getMessages);
router.post('/messages/exchange/:exchange_id/read', messageController.markAsRead);

// 收藏相关
router.post('/favorites', favoriteController.addFavorite);
router.delete('/favorites/:item_id', favoriteController.removeFavorite);
router.get('/favorites', favoriteController.getMyFavorites);
router.get('/favorites/check/:item_id', favoriteController.checkFavorite);
router.get('/favorites/count', favoriteController.getFavoriteCount);
router.post('/favorites/batch-check', favoriteController.batchCheckFavorites);

// AI估值相关（需要登录）
router.post('/ai/evaluate', aiController.evaluateItem);
router.post('/ai/evaluate/batch', aiController.batchEvaluate);

// 学生认证相关
router.post('/verification/submit', verificationController.submitVerification);
router.get('/verification/status', verificationController.getVerificationStatus);
router.get('/verification/history', verificationController.getVerificationHistory);

// 管理员接口（学生认证审核）
router.get('/admin/verifications/pending', verificationController.getPendingVerifications);
router.post('/admin/verifications/:id/review', verificationController.reviewVerification);
router.get('/admin/verifications/stats', verificationController.getVerificationStats);

module.exports = router;
