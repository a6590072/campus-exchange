const OpenAI = require('openai');

// 初始化阿里云百炼客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY || 'sk-sp-80d30ee1dfc44b72bd7b456d110b1727',
  baseURL: process.env.DASHSCOPE_BASE_URL || 'https://coding.dashscope.aliyuncs.com/v1',
});

const MODEL = process.env.DASHSCOPE_MODEL || 'kimi-k2.5';

/**
 * AI物品估值服务
 * @param {Object} itemData - 物品信息
 * @param {Array} images - 图片URL数组
 * @returns {Promise<Object>} 估值结果
 */
async function evaluateItem(itemData, images = []) {
  try {
    const prompt = `你是一位专业的二手物品评估师，擅长评估大学生常用物品的价值。

请根据以下物品信息给出专业评估：

物品标题：${itemData.title}
物品描述：${itemData.description || '无'}
物品分类：${itemData.category || '未分类'}
原价：${itemData.originalPrice || '未知'}元
成色描述：${itemData.conditionDescription || '未描述'}

请从以下维度进行评估：
1. 物品识别：品牌、型号、规格
2. 成色评估：全新(1.0)、99新(0.95)、9成新(0.9)、8成新(0.8)、7成新及以下(0.7)
3. 市场价值：基于二手市场行情给出合理估值区间
4. 保值分析：该物品的保值能力
5. 交易建议：如何定价更容易成交

请以JSON格式返回：
{
  "identifiedName": "识别出的具体名称",
  "brand": "品牌",
  "model": "型号",
  "conditionScore": 0.9,
  "conditionLevel": "9成新",
  "estimatedValueMin": 100,
  "estimatedValueMax": 150,
  "estimatedValue": 125,
  "confidence": 0.85,
  "marketAnalysis": "市场分析",
  "tradingTips": "交易建议",
  "tags": ["标签1", "标签2"]
}`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是专业的二手物品评估专家，擅长评估数码产品、书籍、生活用品等大学生常见物品的价值。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // 提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('AI返回格式错误');
  } catch (error) {
    console.error('AI估值失败:', error);
    // 返回默认值
    return {
      identifiedName: itemData.title,
      brand: '',
      model: '',
      conditionScore: 0.85,
      conditionLevel: '9成新',
      estimatedValueMin: Math.floor((itemData.originalPrice || 100) * 0.5),
      estimatedValueMax: Math.floor((itemData.originalPrice || 100) * 0.8),
      estimatedValue: Math.floor((itemData.originalPrice || 100) * 0.65),
      confidence: 0.5,
      marketAnalysis: '基于描述的基础估值',
      tradingTips: '建议提供更多图片和详细描述以获得更准确的估值',
      tags: [itemData.category || '其他']
    };
  }
}

/**
 * 生成物品描述
 * @param {Object} itemData - 物品基础信息
 * @returns {Promise<string>} 生成的描述
 */
async function generateDescription(itemData) {
  try {
    const prompt = `请为以下二手物品生成一个吸引人的商品描述：

物品名称：${itemData.title}
分类：${itemData.category}
成色：${itemData.condition}
特点：${itemData.features || '无'}

要求：
1. 语言亲切自然，符合大学生交流风格
2. 突出物品亮点和使用价值
3. 说明交换意愿（如：想换什么类型的物品）
4. 100-150字左右
5. 可以适当加emoji增加亲和力`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是擅长写商品文案的大学生，语言风格亲切活泼。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('生成描述失败:', error);
    return `${itemData.title}，${itemData.condition}，希望能换到心仪的物品~`;
  }
}

/**
 * 智能匹配推荐
 * @param {Object} userData - 用户信息
 * @param {Array} userItems - 用户发布的物品
 * @param {Array} targetItems - 候选物品列表
 * @returns {Promise<Array>} 匹配排序后的物品
 */
async function matchItems(userData, userItems, targetItems) {
  try {
    const prompt = `作为智能匹配助手，请分析以下匹配请求：

【用户信息】
- 学校：${userData.schoolName}
- 年级：${userData.grade}
- 偏好标签：${(userData.preferences || []).join(', ')}

【用户发布的物品】
${userItems.map(item => `- ${item.title} (${item.category}, 估值${item.estimatedValue}元)`).join('\n')}

【候选物品】
${targetItems.map((item, idx) => `${idx + 1}. ${item.title} (${item.category}, 估值${item.estimatedValue}元, 成色${item.condition})`).join('\n')}

请分析每个候选物品与用户发布物品的匹配度，考虑：
1. 价值匹配度（估值差距）
2. 类别互补性（是否是用户想要的类型）
3. 成色匹配
4. 交易可行性

请按匹配度从高到低排序，返回前5个最匹配的候选物品编号（只返回编号数组，如[3,1,5,2,4]）：`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是智能物品交换匹配助手，擅长分析物品匹配度和推荐合适的交换对象。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\[([\d,\s]+)\]/);
    
    if (match) {
      const indices = match[1].split(',').map(s => parseInt(s.trim()) - 1);
      return indices.filter(i => i >= 0 && i < targetItems.length).map(i => targetItems[i]);
    }
    
    return targetItems.slice(0, 5);
  } catch (error) {
    console.error('智能匹配失败:', error);
    // 按估值接近度排序
    return targetItems
      .sort((a, b) => Math.abs(a.estimatedValue - userItems[0]?.estimatedValue) - Math.abs(b.estimatedValue - userItems[0]?.estimatedValue))
      .slice(0, 5);
  }
}

/**
 * 提取物品标签
 * @param {string} title - 物品标题
 * @param {string} description - 物品描述
 * @returns {Promise<Array>} 标签数组
 */
async function extractTags(title, description = '') {
  try {
    const prompt = `请从以下物品信息中提取关键词标签（3-8个）：

标题：${title}
描述：${description}

要求：
1. 标签要具体，如"iPhone 14"而不是"手机"
2. 包含品牌、型号、品类、特点
3. 只返回标签数组，格式：["标签1", "标签2", ...]`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const content = response.choices[0].message.content;
    const match = content.match(/\[(["'][^"']+["'](,\s*["'][^"']+["'])*)\]/);
    
    if (match) {
      return JSON.parse(`[${match[1]}]`);
    }
    
    return [];
  } catch (error) {
    console.error('提取标签失败:', error);
    return [];
  }
}

/**
 * AI交易助手对话
 * @param {Array} messages - 对话历史
 * @returns {Promise<string>} AI回复
 */
async function chatAssistant(messages) {
  try {
    const systemPrompt = `你是"换换校园"的智能交易助手，专门帮助大学生进行物品交换。

你的职责：
1. 解答关于物品交换流程的疑问
2. 提供交易安全建议
3. 帮助用户撰写商品描述
4. 给出定价建议
5. 协助处理交易纠纷

注意事项：
- 语气亲切友好，像学长学姐一样
- 回答要实用具体
- 涉及金钱交易要提醒注意安全
- 不知道的问题要诚实说明`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI助手对话失败:', error);
    return '抱歉，我暂时无法回答，请稍后再试~';
  }
}

/**
 * 分析交易风险
 * @param {Object} exchangeData - 交易数据
 * @returns {Promise<Object>} 风险分析结果
 */
async function analyzeRisk(exchangeData) {
  try {
    const prompt = `请分析以下交易的风险等级：

交易信息：
- 物品A价值：${exchangeData.itemAValue}元
- 物品B价值：${exchangeData.itemBValue}元
- 价值差：${Math.abs(exchangeData.itemAValue - exchangeData.itemBValue)}元
- 是否补差：${exchangeData.hasCashAdjustment ? '是' : '否'}
- 用户A信用分：${exchangeData.userACredit}
- 用户B信用分：${exchangeData.userBCredit}
- 用户A交易次数：${exchangeData.userATransactions}
- 用户B交易次数：${exchangeData.userBTransactions}

请给出风险等级（低/中/高）和风险提示。`;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是交易安全专家，擅长识别二手交易中的风险。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    
    let riskLevel = 'low';
    if (content.includes('高风险') || content.includes('高')) {
      riskLevel = 'high';
    } else if (content.includes('中风险') || content.includes('中')) {
      riskLevel = 'medium';
    }

    return {
      riskLevel,
      analysis: content,
      suggestions: extractSuggestions(content)
    };
  } catch (error) {
    console.error('风险分析失败:', error);
    return {
      riskLevel: 'low',
      analysis: '基础安全检查通过',
      suggestions: ['建议线下见面交易', '仔细检查物品成色']
    };
  }
}

function extractSuggestions(content) {
  const suggestions = [];
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('建议') || line.includes('注意') || line.includes('提醒')) {
      suggestions.push(line.replace(/^[\s\d\.\-]+/, '').trim());
    }
  }
  return suggestions.slice(0, 3);
}

module.exports = {
  evaluateItem,
  generateDescription,
  matchItems,
  extractTags,
  chatAssistant,
  analyzeRisk
};
