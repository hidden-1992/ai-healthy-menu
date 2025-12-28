import React, { useRef, useCallback } from 'react';
import { readAndCompressImage } from '../utils/imageCompress';

function UploadSection({ selectedImage, onImageSelect, onRemoveImage, onAnalyze, isLoading }) {
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, []);

  // 处理图片（压缩后再上传）
  const processImage = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    try {
      // 压缩图片：最大 1024px，质量 0.8
      const compressedImage = await readAndCompressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
      });
      onImageSelect(compressedImage);
    } catch (error) {
      console.error('图片压缩失败:', error);
      // 压缩失败时使用原图
      const reader = new FileReader();
      reader.onload = (e) => onImageSelect(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  // 处理拖拽
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImage(files[0]);
    }
  }, [processImage]);

  // 点击上传区域
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <section className="upload-section">
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />

      {/* 上传区域 */}
      {!selectedImage && (
        <div
          className="upload-area"
          onClick={handleUploadClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <div className="upload-icon">📷</div>
            <p className="upload-text">点击拍照或上传食材图片</p>
            <p className="upload-hint">支持 JPG、PNG 格式</p>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {selectedImage && (
        <div className="preview-container">
          <img src={selectedImage} alt="预览图片" />
          <button className="btn-remove" onClick={onRemoveImage}>
            ✕
          </button>
        </div>
      )}

      {/* 分析按钮 */}
      <button
        className="btn-analyze"
        disabled={!selectedImage || isLoading}
        onClick={onAnalyze}
      >
        <span className="btn-icon">🔍</span>
        开始识别食材
      </button>
    </section>
  );
}

export default UploadSection;
