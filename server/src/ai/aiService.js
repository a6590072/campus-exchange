const OpenAI = require('openai');

// 初始化阿里百炼客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1',
});

const MODEL = process.env.DASHSCOPE_MODEL || 'kimi-k2.5';

/**
 * AI 智能估价
 * @param {Object} itemInfo - 物品信息
 * @param {string} itemInfo.name - 物品名称
 * @param {string} itemInfo.description - 物品描述
 * @param {string} itemInfo.category - 物品分类
 * @param {string} itemInfo.condition - 成色
 * @param {Array} itemInfo.images - 图片URL数组
 */
async function evaluateItem(itemInfo) {
  const prompt = `你是一个专业的二手物品估价专家。请根据以下物品信息给出估价：

物品名称：${itemInfo.name}
物品描述：${itemInfo.description}
物品分类：${itemInfo.category}
物品成色：${itemInfo.condition}

请提供以下信息（JSON格式）：
{
  "estimatedPrice": {
    "min": 最低估价（数字）,
    "max": 最高估价（数字）,
    "suggested": 建议售价（数字）
  },
  "marketAnalysis": "市场分析（100字以内）",
  "factors": ["影响价格的因素1", "因素2", "因素3"],
  "depreciationRate": "年折旧率",
  "confidence": "置信度（high/medium/low）",
  "similarItems": ["类似物品参考价格1", "参考2"],
  "tips": "出售建议"
}

只返回JSON，不要其他内容。`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个专业的二手物品估价专家，擅长分析物品价值和市场行情。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI估价失败:', error);
    return null;
  }
}

/**
 * AI 对话式发布 - 自然语言转物品信息
 * @param {string} userInput - 用户自然语言输入
 */
async function parseItemFromText(userInput) {
  const prompt = `将用户的自然语言描述转换为结构化的物品信息。

用户输入："${userInput}"

请提取以下信息并以JSON格式返回，不要包含任何其他文字或解释：

{
  "title": "物品标题（简洁明了，20字以内）",
  "description": "详细描述（自动优化，100字以内）",
  "category": "物品分类（从以下选择：电子产品/书籍教材/生活用品/服装鞋帽/运动户外/美妆护肤/食品饮料/其他）",
  "condition": "成色（全新/99新/95新/9成新/8成新/7成新及以下）",
  "originalPrice": 0,
  "expectedItems": ["期望换到的物品1", "物品2"],
  "tags": ["标签1", "标签2", "标签3"],
  "suggestedPrice": 0,
  "keyFeatures": ["物品特点1", "特点2", "特点3"]
}

重要提示：
1. 必须返回纯JSON格式，不要加markdown代码块标记
2. originalPrice 和 suggestedPrice 必须是数字，不能是字符串
3. 如果无法确定价格，设为 0
4. 不要返回任何JSON以外的内容`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个智能物品发布助手，擅长从自然语言中提取关键信息。你的唯一任务是返回合法的JSON格式数据，不要添加任何解释或标记。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
      // 移除 response_format，阿里百炼可能不支持
    });

    const content = response.choices[0].message.content;
    console.log('AI原始响应:', content);

    // 尝试解析 JSON
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('JSON解析失败，尝试修复:', parseError.message);

      // 尝试清理和修复 JSON
      let cleaned = content.trim();

      // 移除可能的 markdown 代码块标记
      cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/gi, '');

      // 尝试提取 JSON 对象
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      // 修复常见的 JSON 问题
      // 1. 修复单引号为双引号
      cleaned = cleaned.replace(/'/g, '"');

      // 2. 修复尾随逗号
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

      // 3. 修复未加引号的键
      cleaned = cleaned.replace(/(\w+):/g, '"$1":');

      console.log('清理后的JSON:', cleaned);

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        console.error('修复后仍无法解析，返回模拟数据');
        return generateMockParsedItem(userInput);
      }
    }
  } catch (error) {
    console.error('AI解析失败:', error);
    return generateMockParsedItem(userInput);
  }
}

/**
 * 生成模拟解析结果（当 AI 失败时使用）
 * @param {string} userInput - 用户输入
 */
function generateMockParsedItem(userInput) {
  // 简单的关键词匹配
  const input = userInput.toLowerCase();

  // 分类识别
  let category = '其他';
  if (input.includes('手机') || input.includes('电脑') || input.includes('ipad') || input.includes('耳机')) {
    category = '电子产品';
  } else if (input.includes('书') || input.includes('教材')) {
    category = '书籍教材';
  } else if (input.includes('衣服') || input.includes('鞋') || input.includes('包')) {
    category = '服装鞋帽';
  } else if (input.includes('化妆品') || input.includes('护肤品')) {
    category = '美妆护肤';
  }

  // 成色识别
  let condition = '9成新';
  if (input.includes('全新') || input.includes('未拆封')) {
    condition = '全新';
  } else if (input.includes('99新')) {
    condition = '99新';
  } else if (input.includes('95新')) {
    condition = '95新';
  } else if (input.includes('8成新')) {
    condition = '8成新';
  }

  // 提取价格
  let originalPrice = null;
  let suggestedPrice = null;
  const priceMatch = input.match(/(\d+)\s*元?/);
  if (priceMatch) {
    originalPrice = parseInt(priceMatch[1]);
    suggestedPrice = Math.floor(originalPrice * 0.7);
  }

  return {
    title: userInput.slice(0, 20),
    description: userInput,
    category: category,
    condition: condition,
    originalPrice: originalPrice,
    expectedItems: ['等价物品', '学习用品'],
    tags: [category, condition, '校园'],
    suggestedPrice: suggestedPrice,
    keyFeatures: ['适合学生', '性价比高'],
    is_mock: true
  };
}

/**
 * AI 智能匹配 - 找到最佳交换对象
 * @param {Object} myItem - 我的物品
 * @param {Array} availableItems - 可交换的物品列表
 */
async function findBestMatches(myItem, availableItems) {
  const itemsText = availableItems.map((item, index) => 
    `${index + 1}. ${item.title} - ${item.description} - 期望换：${item.expected_items || '无特定要求'}`
  ).join('\n');

  const prompt = `作为交换匹配专家，请为以下物品找到最佳交换对象：

【我的物品】
名称：${myItem.title}
描述：${myItem.description}
分类：${myItem.category}
期望换：${myItem.expected_items || '无特定要求'}

【可交换物品列表】
${itemsText}

请分析并返回（JSON格式）：
{
  "matches": [
    {
      "itemIndex": "匹配物品的序号",
      "matchScore": "匹配度分数（1-100）",
      "reason": "推荐理由（50字以内）",
      "suggestedExchange": "建议交换方案"
    }
  ],
  "topPick": "最推荐的序号",
  "analysis": "整体匹配分析"
}

只返回JSON，不要其他内容。`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个专业的物品交换匹配专家，擅长分析物品价值和交换可行性。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI匹配失败:', error);
    return null;
  }
}

/**
 * AI 智能客服 - 自动回答问题
 * @param {string} question - 用户问题
 * @param {Object} context - 上下文信息
 */
async function customerService(question, context = {}) {
  const systemPrompt = `你是"换换校园"平台的AI智能客服助手。平台是一个大学生物换物平台。

平台规则：
1. 只支持校园内面对面交换，不支持邮寄
2. 交换前必须实名认证
3. 禁止交换违禁品、食品、药品等
4. 交换完成后双方互评

常见问题：
- 如何发布物品？点击底部"+"号，填写物品信息
- 如何交换？找到心仪物品，点击"想要"，等待对方同意
- 如何认证？在"我的"页面点击"学生认证"
- 交换安全？建议在人多的公共场所进行交换

请用友好、专业的语气回答用户问题。如果问题超出范围，引导用户联系人工客服。`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return {
      answer: response.choices[0].message.content,
      isHelpful: true
    };
  } catch (error) {
    console.error('AI客服失败:', error);
    return {
      answer: '抱歉，我暂时无法回答这个问题，请联系人工客服。',
      isHelpful: false
    };
  }
}

/**
 * AI 生成交易话术
 * @param {Object} myItem - 我的物品
 * @param {Object} targetItem - 对方物品
 */
async function generateExchangeMessage(myItem, targetItem) {
  const prompt = `请帮我写一段礼貌、真诚的交换申请话术：

【我的物品】
${myItem.title} - ${myItem.description}

【想换的物品】
${targetItem.title} - ${targetItem.description}

要求：
1. 礼貌友好，体现诚意
2. 简要介绍我的物品优势
3. 表达交换意愿
4. 50-100字
5. 适合大学生之间的交流语气`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个擅长沟通的交换顾问，帮助用户写出得体的交换申请。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI生成话术失败:', error);
    return `你好！我对你的${targetItem.title}很感兴趣。我有${myItem.title}，${myItem.condition}，不知道你是否愿意交换？`;
  }
}

/**
 * AI 内容审核
 * @param {string} content - 内容文本
 * @param {Array} images - 图片URL数组
 */
async function contentReview(content, images = []) {
  const prompt = `请审核以下内容是否适合发布在校园物换物平台：

内容："${content}"

审核标准：
1. 是否包含违禁品（毒品、武器、管制刀具等）
2. 是否包含违规服务（代考、代写论文等）
3. 是否包含敏感政治内容
4. 是否包含色情低俗内容
5. 是否包含诈骗、虚假广告
6. 是否涉及食品、药品（校园内禁止）

返回JSON格式：
{
  "isApproved": "是否通过（true/false）",
  "riskLevel": "风险等级（low/medium/high）",
  "violationType": "违规类型（如无则填null）",
  "reason": "审核说明",
  "suggestions": "修改建议（如未通过）"
}

只返回JSON，不要其他内容。`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个严格的内容审核员，负责维护校园平台的安全和合规。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI审核失败:', error);
    return { isApproved: true, riskLevel: 'low', reason: '自动通过' };
  }
}

/**
 * AI 价格谈判建议
 * @param {Object} myItem - 我的物品
 * @param {Object} theirItem - 对方物品
 * @param {number} priceDiff - 价格差异
 */
async function negotiateAdvice(myItem, theirItem, priceDiff) {
  const prompt = `请提供价格谈判建议：

【我的物品】${myItem.title}，估价${myItem.suggested_price}元
【对方物品】${theirItem.title}，估价${theirItem.suggested_price}元
【价格差】${priceDiff}元

请提供（JSON格式）：
{
  "strategy": "谈判策略（50字以内）",
  "suggestions": ["建议1", "建议2", "建议3"],
  "fairDeal": "公平交易方案",
  "bottomLine": "底线建议",
  "talkingPoints": ["可以强调的优势1", "优势2"]
}

只返回JSON，不要其他内容。`;

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: '你是一个谈判专家，擅长帮助用户达成双赢的交易。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI谈判建议失败:', error);
    return null;
  }
}

module.exports = {
  evaluateItem,
  parseItemFromText,
  findBestMatches,
  customerService,
  generateExchangeMessage,
  contentReview,
  negotiateAdvice
};
