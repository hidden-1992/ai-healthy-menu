/**
 * Vercel Serverless Function - 食材分析 API
 * POST /api/analyze
 */

// 配置
const CONFIG = {
  model: 'google/gemini-2.0-flash-001',
  maxTokens: 4096,
  temperature: 0.7,
};

// 健康标签映射
const HEALTH_TAG_LABELS = {
  hypertension: '高血压',
  hyperlipidemia: '高血脂',
  diabetes: '糖尿病',
  gout: '痛风',
};

// 过敏源映射
const ALLERGEN_LABELS = {
  seafood: '海鲜',
  peanut: '花生',
  milk: '牛奶',
  egg: '鸡蛋',
  wheat: '小麦',
  soy: '大豆',
};

// 解析 Base64 图片
function parseBase64Image(base64Image) {
  let imageData = base64Image;
  let mediaType = 'image/jpeg';

  if (base64Image.startsWith('data:')) {
    const matches = base64Image.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      mediaType = matches[1];
      imageData = matches[2];
    }
  }

  return { mediaType, imageData };
}

// 从响应中提取 JSON
function extractJsonFromResponse(content) {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    return JSON.parse(content.substring(startIdx, endIdx + 1));
  }

  throw new Error('无法从响应中提取 JSON');
}

// 格式化用户健康档案
function formatUserProfileForPrompt(userProfile) {
  if (!userProfile) return '';

  const parts = [];
  const gender = userProfile.gender === 'male' ? '男' : '女';
  parts.push(`性别: ${gender}`);
  if (userProfile.age) parts.push(`年龄: ${userProfile.age}岁`);
  if (userProfile.height) parts.push(`身高: ${userProfile.height}cm`);
  if (userProfile.weight) parts.push(`体重: ${userProfile.weight}kg`);

  if (userProfile.healthTags && userProfile.healthTags.length > 0) {
    const tags = userProfile.healthTags.map(t => HEALTH_TAG_LABELS[t] || t).join('、');
    parts.push(`健康状况: ${tags}`);
  }

  if (userProfile.allergens && userProfile.allergens.length > 0) {
    const allergens = userProfile.allergens.map(a => ALLERGEN_LABELS[a] || a).join('、');
    parts.push(`过敏源: ${allergens}`);
  }

  return parts.join('，');
}

// 生成分析提示词
function generateAnalysisPrompt(userProfile) {
  const userContext = formatUserProfileForPrompt(userProfile);
  const healthWarning = userProfile?.healthTags?.length > 0 
    ? `\n【健康过滤要求】用户有以下健康问题：${userProfile.healthTags.map(t => HEALTH_TAG_LABELS[t]).join('、')}。推荐菜谱时必须考虑这些健康限制，避免推荐不适合的菜品。如果检测到可能不适合的食材，需要在 nutritionTips.warning 中给出提醒。`
    : '';
  const allergenWarning = userProfile?.allergens?.length > 0
    ? `\n【过敏源警告】用户对以下食物过敏：${userProfile.allergens.map(a => ALLERGEN_LABELS[a]).join('、')}。如果识别到这些食材，必须在 nutritionTips.warning 中强调过敏风险，且不要推荐含有这些食材的菜谱。`
    : '';

  return `你是一个专业的中国家庭食材识别专家和营养师。请仔细分析这张图片，识别出图片中所有的食物和食材。

${userContext ? `【用户健康档案】${userContext}` : ''}${healthWarning}${allergenWarning}

【重要】所有输出内容必须使用简体中文。

请严格按照以下JSON格式返回结果：
{
    "ingredients": [
        {"name": "食材中文名称", "icon": "对应emoji", "confidence": "高/中/低", "proportion": "大/中/小"}
    ],
    "recipes": [
        {
            "name": "中文菜名",
            "icon": "菜品emoji",
            "time": "XX分钟",
            "difficulty": "easy/medium/hard",
            "difficultyText": "简单/中等/困难",
            "ingredients": ["食材1 适量", "食材2 适量"],
            "steps": ["第一步的中文描述", "第二步的中文描述"],
            "nutrition": {"protein": 20, "carbs": 15, "fat": 10, "calories": 250},
            "healthNote": "针对用户健康状况的特别说明（如有）"
        }
    ],
    "nutritionTips": {
        "balance": "营养均衡建议",
        "cooking": "烹饪建议",
        "warning": "注意事项（包括过敏提醒、健康限制提醒等）"
    }
}

要求：
1. 食材列表按识别精确度和图片占比从高到低排序
2. 根据识别到的食材，推荐3-4道中国家常菜
3. 每道菜提供详细的中文烹饪步骤（5-8步）
4. 每道菜的nutrition字段必须给出合理估算值
5. 如果用户有健康问题，在 healthNote 中说明该菜品是否适合
6. 请只返回JSON，不要有其他内容。`;
}

// 调用 OpenRouter API
async function callOpenRouterAPI(messages) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://huishi-ai.vercel.app',
      'X-Title': 'HuiShi AI',
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: messages,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'API 错误');
  }

  const content = data.choices[0].message.content;
  return extractJsonFromResponse(content);
}

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, userProfile } = req.body;

    if (!image) {
      return res.status(400).json({ error: '请提供图片' });
    }

    const { mediaType, imageData } = parseBase64Image(image);
    const prompt = generateAnalysisPrompt(userProfile);

    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: `data:${mediaType};base64,${imageData}` },
          },
        ],
      },
    ];

    const result = await callOpenRouterAPI(messages);
    return res.status(200).json(result);
  } catch (error) {
    console.error('分析错误:', error);
    return res.status(500).json({ error: error.message || '分析失败' });
  }
}
