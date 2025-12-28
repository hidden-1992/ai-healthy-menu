/**
 * Vercel Serverless Function - 成品菜分析 API
 * POST /api/analyze-food
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
    const userContext = formatUserProfileForPrompt(userProfile);

    const prompt = `你是一个专业的营养师。请分析这张食物图片，识别菜品并估算营养成分。

${userContext ? `【用户健康档案】${userContext}` : ''}

请严格按照以下JSON格式返回结果：
{
    "name": "菜品中文名称",
    "icon": "菜品emoji",
    "weight": 300,
    "calories": 450,
    "protein": 25,
    "carbs": 30,
    "fat": 20,
    "healthLevel": "green/yellow/red",
    "advice": "针对用户健康状况的个性化建议"
}

说明：
- weight: 预估重量（克）
- calories: 预估热量（千卡）
- protein/carbs/fat: 蛋白质/碳水/脂肪（克）
- healthLevel: 
  - green(🟢推荐): 健康、低热量、适合用户
  - yellow(🟡适量): 一般、需要控制摄入量
  - red(🔴警告): 高热量/高糖/高油/高嘌呤等，不太适合用户健康状况
- advice: 根据用户健康档案给出的个性化建议

请只返回JSON，不要有其他内容。`;

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
