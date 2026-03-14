const axios = require('axios');

// AI 配置 - 使用阿里百炼 API
const AI_CONFIG = {
  // 使用阿里百炼 Coding Plan API (兼容 OpenAI 接口协议)
  apiKey: process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY || '',
  baseURL: process.env.DASHSCOPE_BASE_URL || process.env.OPENAI_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1',
  model: process.env.DASHSCOPE_MODEL || process.env.OPENAI_MODEL || 'kimi-k2.5',
  // 是否启用 AI（如果没有配置 API Key，则使用模拟数据）
  enabled: !!(process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY)
};

/**
 * 调用 AI 进行物品估值
 * @param {Object} itemData - 物品信息
 * @returns {Object} 估值结果
 */
async function evaluateItem(itemData) {
  const {
    title,
    description,
    category,
    condition_level,
    condition_description,
    original_price,
    images = []
  } = itemData;

  // 如果没有配置 AI，返回模拟估值
  if (!AI_CONFIG.enabled) {
    console.log('AI 未配置，使用模拟估值');
    return generateMockEvaluation(itemData);
  }

  try {
    const prompt = buildEvaluationPrompt(itemData);
    
    const response = await axios.post(
      `${AI_CONFIG.baseURL}/chat/completions`,
      {
        model: AI_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的二手物品估价师，擅长根据物品信息给出合理的估价建议。请用 JSON 格式返回估价结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices[0].message.content;
    
    // 解析 JSON 响应
    const result = parseAIResponse(content);
    
    return {
      success: true,
      estimated_value_min: result.min_price,
      estimated_value_max: result.max_price,
      estimated_value_ai: result.suggested_price,
      ai_description: result.description,
      ai_tags: result.tags || [],
      ai_features: {
        brand: result.brand,
        model: result.model,
        conditionScore: result.condition_score,
        marketTrend: result.market_trend
      },
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('AI 估值失败:', error.message);
    // 失败时返回模拟估值
    return generateMockEvaluation(itemData);
  }
}

/**
 * 构建估值提示词
 */
function buildEvaluationPrompt(itemData) {
  const {
    title,
    description,
    category,
    condition_level,
    condition_description,
    original_price
  } = itemData;

  return `请对以下二手物品进行专业估价：

【物品信息】
- 标题：${title}
- 分类：${category || '未分类'}
- 成色：${condition_level || '未说明'}
- 成色描述：${condition_description || '无'}
- 原价：${original_price ? original_price + '元' : '未知'}
- 详细描述：${description || '无'}

请根据以上信息，给出专业的估价建议。返回格式必须是以下 JSON：

{
  "min_price": 最低估价（数字，单位元）,
  "max_price": 最高估价（数字，单位元）,
  "suggested_price": 建议售价（数字，单位元）,
  "description": "AI 对物品的简要描述（50字以内）",
  "tags": ["标签1", "标签2", "标签3"],
  "brand": "品牌（如识别出）",
  "model": "型号（如识别出）",
  "condition_score": 成色评分（1-10）,
  "market_trend": "市场趋势：stable/rising/falling",
  "reasoning": "估价理由（100字以内）"
}

注意：
1. 价格必须是数字，不要带单位
2. suggested_price 应该在 min_price 和 max_price 之间
3. 如果无法识别品牌或型号，设为 null
4. 只返回 JSON，不要其他内容`;
}

/**
 * 解析 AI 响应
 */
function parseAIResponse(content) {
  try {
    // 尝试直接解析
    return JSON.parse(content);
  } catch (e) {
    // 尝试从 markdown 代码块中提取
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                      content.match(/```\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    
    // 尝试提取 JSON 对象
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    
    throw new Error('无法解析 AI 响应');
  }
}

/**
 * 生成模拟估值（当 AI 不可用时）
 */
function generateMockEvaluation(itemData) {
  const { original_price, condition_level, category } = itemData;
  
  // 成色折扣
  const conditionDiscounts = {
    '全新': 0.9,
    '99新': 0.85,
    '95新': 0.8,
    '9成新': 0.7,
    '8成新': 0.6,
    '7成新及以下': 0.5
  };
  
  const discount = conditionDiscounts[condition_level] || 0.7;
  
  // 计算估值
  let basePrice = original_price ? original_price * discount : 100;
  
  // 如果没有原价，根据分类给基础价格
  if (!original_price) {
    const categoryBasePrices = {
      '电子产品': 500,
      '图书': 30,
      '生活用品': 50,
      '服饰': 80,
      '运动户外': 150,
      '美妆护肤': 100,
      '食品': 30,
      '其他': 50
    };
    basePrice = categoryBasePrices[category] || 50;
    basePrice = basePrice * discount;
  }
  
  const minPrice = Math.floor(basePrice * 0.8);
  const maxPrice = Math.floor(basePrice * 1.2);
  const suggestedPrice = Math.floor(basePrice);
  
  // 生成标签
  const tags = generateTags(category, condition_level);
  
  return {
    success: true,
    estimated_value_min: minPrice,
    estimated_value_max: maxPrice,
    estimated_value_ai: suggestedPrice,
    ai_description: `这是一${condition_level || '成色不错'}的${category || '物品'}，适合校园交换。`,
    ai_tags: tags,
    ai_features: {
      brand: null,
      model: null,
      conditionScore: Math.floor(discount * 10),
      marketTrend: 'stable'
    },
    reasoning: `根据${condition_level || '描述'}的成色，参考${original_price ? '原价' : '同类物品市场价'}进行估价。`,
    is_mock: true
  };
}

/**
 * 生成标签
 */
function generateTags(category, condition) {
  const tags = [];
  
  if (category) tags.push(category);
  if (condition) tags.push(condition);
  
  const commonTags = ['校园热门', '性价比', '实用'];
  const randomTags = commonTags.sort(() => 0.5 - Math.random()).slice(0, 2);
  
  return [...tags, ...randomTags];
}

/**
 * 批量估值
 */
async function batchEvaluate(items) {
  const results = [];
  
  for (const item of items) {
    try {
      const evaluation = await evaluateItem(item);
      results.push({
        item_id: item.id,
        ...evaluation
      });
    } catch (error) {
      results.push({
        item_id: item.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  evaluateItem,
  batchEvaluate,
  AI_CONFIG
};
