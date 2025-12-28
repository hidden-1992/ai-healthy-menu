/**
 * API 服务模块
 * 处理与后端的通信
 */

/**
 * 分析图片，识别食材并获取菜谱推荐
 * @param {string} imageData - Base64 编码的图片数据
 * @param {Function} onProgress - 进度回调函数
 * @param {Object} userProfile - 用户健康档案
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeImage(imageData, onProgress, userProfile) {
  onProgress?.('正在上传图片...');

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      image: imageData,
      userProfile: userProfile || null,
    }),
  });

  onProgress?.('AI正在分析食材...');

  if (!response.ok) {
    const error = await response.json();
    return { error: error.error || '请求失败' };
  }

  onProgress?.('正在生成菜谱推荐...');

  const result = await response.json();
  return result;
}

/**
 * 分析成品菜图片，估算热量
 * @param {string} imageData - Base64 编码的图片数据
 * @param {Object} userProfile - 用户健康档案
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeFoodImage(imageData, userProfile) {
  const response = await fetch('/api/analyze-food', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageData,
      userProfile: userProfile || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { error: error.error || '请求失败' };
  }

  const result = await response.json();
  return result;
}

/**
 * 获取场景化推荐
 * @param {Object} scene - 场景信息
 * @param {Object} userProfile - 用户健康档案
 * @returns {Promise<Object>} 推荐结果
 */
export async function getSceneRecommendation(scene, userProfile) {
  const response = await fetch('/api/scene-recommend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scene: scene,
      userProfile: userProfile || null,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { error: error.error || '请求失败' };
  }

  const result = await response.json();
  return result;
}
