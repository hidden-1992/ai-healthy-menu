/**
 * 图片压缩工具
 * 压缩图片以加快上传和 AI 分析速度
 */

/**
 * 压缩图片
 * @param {string} base64Image - Base64 编码的图片
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度，默认 1024
 * @param {number} options.maxHeight - 最大高度，默认 1024
 * @param {number} options.quality - 压缩质量 0-1，默认 0.8
 * @returns {Promise<string>} 压缩后的 Base64 图片
 */
export function compressImage(base64Image, options = {}) {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;

      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // 创建 canvas 进行压缩
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为压缩后的 Base64
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = base64Image;
  });
}

/**
 * 从文件读取并压缩图片
 * @param {File} file - 图片文件
 * @param {Object} options - 压缩选项
 * @returns {Promise<string>} 压缩后的 Base64 图片
 */
export function readAndCompressImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const compressed = await compressImage(e.target.result, options);
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsDataURL(file);
  });
}
