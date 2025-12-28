/**
 * Vercel Serverless Function - 场景推荐 API
 * POST /api/scene-recommend
 */

// 配置
const CONFIG = {
  model: 'google/gemini-3-pro-preview',
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

// 场景描述
const SCENE_DESCRIPTIONS = {
  cold: '感冒发烧，身体虚弱，需要恢复体力',
  drunk: '刚刚饮酒，需要解酒护肝',
  exercise: '刚刚运动完，需要补充能量和蛋白质',
  period: '女性生理期，需要温补调理',
  tired: '疲劳困倦，需要提神醒脑',
  stomach: '肠胃不适，需要养胃调理',
};

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
    const { scene, userProfile } = req.body;

    if (!scene) {
      return res.status(400).json({ error: '请提供场景信息' });
    }

    const userContext = formatUserProfileForPrompt(userProfile);

    const prompt = `你是一个专业的营养师和中医食疗专家。用户当前状态：${scene.label}（${SCENE_DESCRIPTIONS[scene.id] || scene.desc}）

${userContext ? `【用户健康档案】${userContext}` : ''}

请根据用户当前状态和健康档案，给出饮食建议。

请严格按照以下JSON格式返回结果：
{
    "recommended": [
        {"name": "推荐食物名称", "icon": "食物emoji", "reason": "推荐理由（20字以内）"},
        {"name": "推荐食物名称", "icon": "食物emoji", "reason": "推荐理由"},
        {"name": "推荐食物名称", "icon": "食物emoji", "reason": "推荐理由"},
        {"name": "推荐食物名称", "icon": "食物emoji", "reason": "推荐理由"},
        {"name": "推荐食物名称", "icon": "食物emoji", "reason": "推荐理由"}
    ],
    "forbidden": [
        {"name": "禁忌食物名称", "icon": "食物emoji", "reason": "禁忌理由（20字以内）"},
        {"name": "禁忌食物名称", "icon": "食物emoji", "reason": "禁忌理由"},
        {"name": "禁忌食物名称", "icon": "食物emoji", "reason": "禁忌理由"}
    ],
    "tips": "综合建议（50-100字，包括饮食建议和生活建议）"
}

要求：
1. 推荐5种适合当前状态的食物
2. 列出3种应该避免的食物
3. 如果用户有健康问题（如高血压、糖尿病等），推荐时必须考虑这些限制
4. 给出实用的综合建议
5. 请只返回JSON，不要有其他内容。`;

    const messages = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const result = await callOpenRouterAPI(messages);
    return res.status(200).json(result);
  } catch (error) {
    console.error('推荐错误:', error);
    return res.status(500).json({ error: error.message || '推荐失败' });
  }
}
