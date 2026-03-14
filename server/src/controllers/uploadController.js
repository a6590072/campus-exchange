const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadDir, 'images');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WEBP 格式的图片'), false);
  }
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 9 // 最多9张图片
  }
});

/**
 * 上传单张图片
 */
exports.uploadSingle = upload.single('image');

/**
 * 上传多张图片
 */
exports.uploadMultiple = upload.array('images', 9);

/**
 * 处理单张图片上传
 */
exports.handleSingleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传图片'
      });
    }

    // 构建图片URL
    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败',
      error: error.message
    });
  }
};

/**
 * 处理多张图片上传
 */
exports.handleMultipleUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传图片'
      });
    }

    // 构建图片URL列表
    const images = req.files.map(file => ({
      url: `/uploads/images/${file.filename}`,
      filename: file.filename,
      size: file.size
    }));

    res.json({
      success: true,
      data: {
        images,
        count: images.length
      }
    });
  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败',
      error: error.message
    });
  }
};

/**
 * 删除图片
 */
exports.deleteImage = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: '缺少文件名'
      });
    }

    // 安全检查：防止路径遍历
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        success: false,
        message: '非法文件名'
      });
    }

    const filePath = path.join(imagesDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: '图片删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '图片不存在'
      });
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({
      success: false,
      message: '删除图片失败',
      error: error.message
    });
  }
};

/**
 * 错误处理中间件
 */
exports.handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '图片大小不能超过10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '最多只能上传9张图片'
      });
    }
    return res.status(400).json({
      success: false,
      message: '文件上传错误',
      error: error.message
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
};
