/**
 * AI智能菜谱 - 后端服务
 * 提供图片分析 API 和静态文件服务
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================

const CONFIG = {
  port: 3000,
  openRouter: {
    apiKey: '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',
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

// ==================== 工具函数 ====================

/**
 * 解析 Base64 图片数据
 * @param {string} base64Image - Base64 编码的图片
 * @returns {{ mediaType: string, imageData: string }}
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
 * @param {string} content - API 响应内容
 * @returns {Object} 解析后的 JSON 对象
 */
function extractJsonFromResponse(content) {
  // 尝试提取 markdown 代码块中的 JSON
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // 尝试找到 { 开始的 JSON
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    return JSON.parse(content.substring(startIdx, endIdx + 1));
  }

  throw new Error('无法从响应中提取 JSON');
}

/**
 * 打印 Token 使用统计
 * @param {Object} usage - API 返回的使用统计
 */
function logTokenUsage(usage) {
  if (!usage) return;

  console.log('\n📊 ===== Token 使用统计 =====');
  console.log(`📥 输入 Tokens: ${usage.prompt_tokens || 0}`);
  
  if (usage.prompt_tokens_details) {
    const details = usage.prompt_tokens_details;
    console.log(`   ├─ 缓存命中: ${details.cached_tokens || 0}`);
    console.log(`   └─ 图片 Tokens: ${details.image_tokens || '未知'}`);
  }
  
  console.log(`📤 输出 Tokens: ${usage.completion_tokens || 0}`);
  console.log(`📦 总计 Tokens: ${usage.total_tokens || 0}`);

  if (usage.native_tokens_prompt !== undefined) {
    console.log(`\n🔹 原生统计:`);
    console.log(`   输入: ${usage.native_tokens_prompt}`);
    console.log(`   输出: ${usage.native_tokens_completion}`);
  }
  
  console.log('============================\n');
}

// ==================== AI 分析服务 ====================

/**
 * 生成食材识别提示词
 * @returns {string} 提示词
 */
function generateAnalysisPrompt() {
  return `你是一个专业的中国家庭食材识别专家和营养师。请仔细分析这张图片，识别出图片中所有的食物和食材。

【重要】所有输出内容必须使用简体中文，包括食材名称、菜名、烹饪步骤、营养建议等所有文字内容。

【排序要求】识别出的食材必须按照以下优先级排序：
1. 识别置信度最高的排在前面
2. 在图片中占比面积最大的排在前面
3. 最清晰可见的排在前面

请严格按照以下JSON格式返回结果，不要添加任何其他文字：
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
            "nutrition": {"protein": 20, "carbs": 15, "fat": 10, "calories": 250}
        }
    ],
    "nutritionTips": {
        "balance": "中文营养均衡建议，针对识别到的食材给出具体建议",
        "cooking": "中文烹饪建议，说明最佳烹饪方式",
        "warning": "中文注意事项，如过敏提醒、食材搭配禁忌等"
    }
}

要求：
1. 【语言要求】所有文字内容必须是简体中文，不要出现英文
2. 【排序要求】食材列表必须按识别精确度和图片占比从高到低排序，最主要的食材放在最前面
3. 每个食材标注置信度（高/中/低）和在图片中的占比（大/中/小）
4. 识别图片中所有可见的食材，用中文名称，配上合适的emoji
5. 根据识别到的食材，推荐3-4道中国家常菜，优先使用排序靠前的主要食材
6. 每道菜提供详细的中文烹饪步骤（5-8步），步骤要具体实用
7. 烹饪时间格式为"XX分钟"，如"15分钟"、"30分钟"
8. 食材用量用中文描述，如"适量"、"2个"、"100克"
9. 【营养数据要求】每道菜的nutrition字段必须根据食材和份量给出合理估算值（单位：克/千卡），数值要符合实际
10. 提供针对性的中文营养搭配建议，要具体有用
11. 如果图片中没有食材，返回空的ingredients数组，并在nutritionTips.warning中用中文说明

请只返回JSON，不要有其他内容。`;
}

/**
 * 调用 OpenRouter API 分析图片
 * @param {string} base64Image - Base64 编码的图片
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeImageWithAI(base64Image) {
  const { mediaType, imageData } = parseBase64Image(base64Image);
  const prompt = generateAnalysisPrompt();

  const requestBody = JSON.stringify({
    model: CONFIG.openRouter.model,
    messages: [
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
    ],
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
        'X-Title': 'AI Smart Recipe',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.error) {
            reject(new Error(response.error.message || 'API 错误'));
            return;
          }

          logTokenUsage(response.usage);

          const content = response.choices[0].message.content;
          const result = extractJsonFromResponse(content);
          resolve(result);
        } catch (e) {
          console.error('解析错误:', e, '响应:', data);
          reject(new Error('解析 API 响应失败'));
        }
      });
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
}

// ==================== HTTP 处理器 ====================

/**
 * 设置 CORS 响应头
 * @param {http.ServerResponse} res - 响应对象
 */
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 发送 JSON 响应
 * @param {http.ServerResponse} res - 响应对象
 * @param {number} statusCode - 状态码
 * @param {Object} data - 响应数据
 */
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * 处理图片分析 API 请求
 * @param {http.IncomingMessage} req - 请求对象
 * @param {http.ServerResponse} res - 响应对象
 */
async function handleAnalyzeRequest(req, res) {
  let body = '';
  
  req.on('data', (chunk) => (body += chunk));
  req.on('end', async () => {
    try {
      const { image } = JSON.parse(body);

      if (!image) {
        sendJsonResponse(res, 400, { error: '请提供图片' });
        return;
      }

      console.log('🔍 开始分析图片...');
      const result = await analyzeImageWithAI(image);
      console.log('✅ 分析完成');

      sendJsonResponse(res, 200, result);
    } catch (error) {
      console.error('❌ 分析错误:', error);
      sendJsonResponse(res, 500, { error: error.message || '分析失败，请重试' });
    }
  });
}

/**
 * 处理静态文件请求
 * @param {http.IncomingMessage} req - 请求对象
 * @param {http.ServerResponse} res - 响应对象
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

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 路由处理
  if (req.method === 'POST' && req.url === '/api/analyze') {
    await handleAnalyzeRequest(req, res);
  } else {
    handleStaticFileRequest(req, res);
  }
});

server.listen(CONFIG.port, () => {
  console.log('');
  console.log('🍳 ================================');
  console.log('   AI智能菜谱服务器已启动');
  console.log('🍳 ================================');
  console.log(`📍 访问地址: http://localhost:${CONFIG.port}`);
  console.log(`🤖 使用模型: ${CONFIG.openRouter.model}`);
  console.log('');
});
