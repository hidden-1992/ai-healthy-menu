/**
 * 慧食 AI - 后端服务
 * 提供图片分析 API 和静态文件服务
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config();

// ==================== 配置 ====================

// 检查必需的环境变量
if (!process.env.OPENROUTER_API_KEY) {
  console.error('错误: 请设置 OPENROUTER_API_KEY 环境变量');
  console.error('提示: 创建 .env 文件并添加 OPENROUTER_API_KEY=your_api_key');
  process.exit(1);
}

const CONFIG = {
  port: process.env.PORT || 3000,
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: 'google/gemini-3-pro-preview',
    maxTokens: 4096,
    temperature: 0.7,
  },
};

// MIME 类型映射
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
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

// ==================== 工具函数 ====================

/**
 * 解析 Base64 图片数据
 */
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

/**
 * 从 API 响应中提取 JSON
 */
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

/**
 * 打印 Token 使用统计
 */
function logTokenUsage(usage) {
  if (!usage) return;

  console.log('\n📊 ===== Token 使用统计 =====');
  console.log(`📥 输入 Tokens: ${usage.prompt_tokens || 0}`);
  console.log(`📤 输出 Tokens: ${usage.completion_tokens || 0}`);
  console.log(`📦 总计 Tokens: ${usage.total_tokens || 0}`);
  console.log('============================\n');
}

/**
 * 格式化用户健康档案为提示词
 */
function formatUserProfileForPrompt(userProfile) {
  if (!userProfile) return '';

  const parts = [];
  
  // 基础信息
  const gender = userProfile.gender === 'male' ? '男' : '女';
  parts.push(`性别: ${gender}`);
  if (userProfile.age) parts.push(`年龄: ${userProfile.age}岁`);
  if (userProfile.height) parts.push(`身高: ${userProfile.height}cm`);
  if (userProfile.weight) parts.push(`体重: ${userProfile.weight}kg`);

  // 健康标签
  if (userProfile.healthTags && userProfile.healthTags.length > 0) {
    const tags = userProfile.healthTags.map(t => HEALTH_TAG_LABELS[t] || t).join('、');
    parts.push(`健康状况: ${tags}`);
  }

  // 过敏源
  if (userProfile.allergens && userProfile.allergens.length > 0) {
    const allergens = userProfile.allergens.map(a => ALLERGEN_LABELS[a] || a).join('、');
    parts.push(`过敏源: ${allergens}`);
  }

  return parts.join('，');
}

// ==================== AI 分析服务 ====================

/**
 * 调用 OpenRouter API
 */
async function callOpenRouterAPI(messages) {
  const requestBody = JSON.stringify({
    model: CONFIG.openRouter.model,
    messages: messages,
    max_tokens: CONFIG.openRouter.maxTokens,
    temperature: CONFIG.openRouter.temperature,
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openRouter.apiKey}`,
        'HTTP-Referer': `http://localhost:${CONFIG.port}`,
        'X-Title': 'HuiShi AI',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const response = JSON.parse(data);

        if (response.error) {
          reject(new Error(response.error.message || 'API 错误'));
          return;
        }

        logTokenUsage(response.usage);

        const content = response.choices[0].message.content;
        const result = extractJsonFromResponse(content);
        resolve(result);
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

/**
 * 生成食材识别提示词
 */
function generateAnalysisPrompt(userProfile) {
  const userContext = formatUserProfileForPrompt(userProfile);
  const healthWarning = userProfile?.healthTags?.length > 0 
    ? `\n【健康过滤要求】用户有以下健康问题：${userProfile.healthTags.map(t => HEALTH_TAG_LABELS[t]).join('、')}。推荐菜谱时必须考虑这些健康限制，避免推荐不适合的菜品（如高血压不推荐高盐菜品，高血脂不推荐油腻菜品，糖尿病不推荐高糖菜品，痛风不推荐高嘌呤食物）。如果检测到可能不适合的食材，需要在 nutritionTips.warning 中给出提醒。`
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

/**
 * 分析食材图片
 */
async function analyzeImageWithAI(base64Image, userProfile) {
  const { mediaType, imageData } = parseBase64Image(base64Image);
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

  return callOpenRouterAPI(messages);
}

/**
 * 分析成品菜图片，估算热量
 */
async function analyzeFoodImageWithAI(base64Image, userProfile) {
  const { mediaType, imageData } = parseBase64Image(base64Image);
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

  return callOpenRouterAPI(messages);
}

/**
 * 获取场景化推荐
 */
async function getSceneRecommendationWithAI(scene, userProfile) {
  const userContext = formatUserProfileForPrompt(userProfile);

  const sceneDescriptions = {
    cold: '感冒发烧，身体虚弱，需要恢复体力',
    drunk: '刚刚饮酒，需要解酒护肝',
    exercise: '刚刚运动完，需要补充能量和蛋白质',
    period: '女性生理期，需要温补调理',
    tired: '疲劳困倦，需要提神醒脑',
    stomach: '肠胃不适，需要养胃调理',
  };

  const prompt = `你是一个专业的营养师和中医食疗专家。用户当前状态：${scene.label}（${sceneDescriptions[scene.id] || scene.desc}）

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

  return callOpenRouterAPI(messages);
}

// ==================== HTTP 处理器 ====================

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * 处理食材分析请求
 */
async function handleAnalyzeRequest(req, res) {
  let body = '';
  
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    const { image, userProfile } = JSON.parse(body);

    if (!image) {
      sendJsonResponse(res, 400, { error: '请提供图片' });
      return;
    }

    console.log('🔍 开始分析食材图片...');
    const result = await analyzeImageWithAI(image, userProfile);
    console.log('✅ 食材分析完成');

    sendJsonResponse(res, 200, result);
  });
}

/**
 * 处理成品菜分析请求
 */
async function handleFoodAnalyzeRequest(req, res) {
  let body = '';
  
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    const { image, userProfile } = JSON.parse(body);

    if (!image) {
      sendJsonResponse(res, 400, { error: '请提供图片' });
      return;
    }

    console.log('🍽️ 开始分析成品菜...');
    const result = await analyzeFoodImageWithAI(image, userProfile);
    console.log('✅ 成品菜分析完成');

    sendJsonResponse(res, 200, result);
  });
}

/**
 * 处理场景推荐请求
 */
async function handleSceneRecommendRequest(req, res) {
  let body = '';
  
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    const { scene, userProfile } = JSON.parse(body);

    if (!scene) {
      sendJsonResponse(res, 400, { error: '请提供场景信息' });
      return;
    }

    console.log(`🎯 开始生成场景推荐: ${scene.label}...`);
    const result = await getSceneRecommendationWithAI(scene, userProfile);
    console.log('✅ 场景推荐完成');

    sendJsonResponse(res, 200, result);
  });
}

/**
 * 处理静态文件请求
 */
function handleStaticFileRequest(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(__dirname, urlPath);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      const statusCode = err.code === 'ENOENT' ? 404 : 500;
      const message = err.code === 'ENOENT' ? 'File not found' : 'Server error';
      res.writeHead(statusCode);
      res.end(message);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// ==================== 服务器启动 ====================

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 路由处理
  if (req.method === 'POST') {
    if (req.url === '/api/analyze') {
      await handleAnalyzeRequest(req, res);
    } else if (req.url === '/api/analyze-food') {
      await handleFoodAnalyzeRequest(req, res);
    } else if (req.url === '/api/scene-recommend') {
      await handleSceneRecommendRequest(req, res);
    } else {
      sendJsonResponse(res, 404, { error: 'Not found' });
    }
  } else {
    handleStaticFileRequest(req, res);
  }
});

server.listen(CONFIG.port, () => {
  console.log('');
  console.log('🥗 ================================');
  console.log('   慧食 AI 服务器已启动');
  console.log('🥗 ================================');
  console.log(`📍 访问地址: http://localhost:${CONFIG.port}`);
  console.log(`🤖 使用模型: ${CONFIG.openRouter.model}`);
  console.log('');
});
