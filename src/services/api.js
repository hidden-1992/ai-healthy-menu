/**
 * API 服务模块
 * 处理与后端的通信
 */

/**
 * 分析图片，识别食材并获取菜谱推荐
 * @param {string} imageData - Base64 编码的图片数据
 * @param {Function} onProgress - 进度回调函数
 * @returns {Promise<Object>} 分析结果
 */
export async function analyzeImage(imageData, onProgress) {
  onProgress?.('正在上传图片...');

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageData }),
  });

  onProgress?.('AI正在分析食材...');

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '请求失败');
  }

  onProgress?.('正在生成菜谱推荐...');

  const result = await response.json();
  return result;
}
