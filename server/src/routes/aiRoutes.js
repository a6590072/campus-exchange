const express = require('express');
const router = express.Router();
const aiService = require('../ai/aiService');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /ai/evaluate
 * @desc AI智能估价
 * @access Public
 */
router.post('/evaluate', async (req, res) => {
  try {
    const { name, description, category, condition, images } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: '缺少物品名称或描述'
      });
    }

    const evaluation = await aiService.evaluateItem({
      name,
      description,
      category,
      condition,
      images
    });

    if (!evaluation) {
      return res.status(500).json({
        success: false,
        message: 'AI估价失败'
      });
    }

    res.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    console.error('AI估价接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * @route POST /ai/parse-item
 * @desc AI对话式发布 - 自然语言转物品信息
 * @access Public
 */
router.post('/parse-item', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '缺少文本内容'
      });
    }

    const parsedItem = await aiService.parseItemFromText(text);

    if (!parsedItem) {
      return res.status(500).json({
        success: false,
        message: 'AI解析失败'
      });
    }

    res.json({
      success: true,
      data: parsedItem
    });

  } catch (error) {
    console.error('AI解析接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * @route POST /ai/find-matches
 * @desc AI智能匹配
 * @access Private
 */
router.post('/find-matches', authenticate, async (req, res) => {
  try {
    const { myItem, availableItems } = req.body;

    if (!myItem || !availableItems || !Array.isArray(availableItems)) {
      return res.status(400).json({
        success: false,
        message: '参数错误'
      });
    }

    const matches = await aiService.findBestMatches(myItem, availableItems);

    if (!matches) {
      return res.status(500).json({
        success: false,
        message: 'AI匹配失败'
      });
    }

    res.json({
      success: true,
      data: matches
    });

  } catch (error) {
    console.error('AI匹配接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * @route POST /ai/customer-service
 * @desc AI智能客服
 * @access Public
 */
router.post('/customer-service', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: '缺少问题内容'
      });
    }

    const answer = await aiService.customerService(question, context);

    res.json({
      success: true,
      data: answer
    });

  } catch (error) {
    console.error('AI客服接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * @route POST /ai/generate-message
 * @desc AI生成交易话术
 * @access Private
 */
router.post('/generate-message', authenticate, async (req, res) => {
  try {
    const { myItem, targetItem } = req.body;

    if (!myItem || !targetItem) {
      return res.status(400).json({
        success: false,
        message: '缺少物品信息'
      });
    }

    const message = await aiService.generateExchangeMessage(myItem, targetItem);

    res.json({
      success: true,
      data: { message }
    });

  } catch (error) {
    console.error('AI生成话术接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * @route POST /ai/content-review
 * @desc AI内容审核
 * @access Public
 */
router.post('/content-review', async (req, res) => {
  try {
    const { content, images } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '缺少内容'
      });
    }

    const review = await aiService.contentReview(content, images);

    res.json({
      success: true,
      data: review
    });

  } catch (error) {
    console.error('AI审核接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

/**
 * @route POST /ai/negotiate-advice
 * @desc AI价格谈判建议
 * @access Private
 */
router.post('/negotiate-advice', authenticate, async (req, res) => {
  try {
    const { myItem, theirItem, priceDiff } = req.body;

    if (!myItem || !theirItem || priceDiff === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    const advice = await aiService.negotiateAdvice(myItem, theirItem, priceDiff);

    if (!advice) {
      return res.status(500).json({
        success: false,
        message: 'AI建议生成失败'
      });
    }

    res.json({
      success: true,
      data: advice
    });

  } catch (error) {
    console.error('AI谈判建议接口错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

module.exports = router;
