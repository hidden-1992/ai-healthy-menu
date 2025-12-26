import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import LoadingSection from './components/LoadingSection';
import ResultsSection from './components/ResultsSection';
import RecipeModal from './components/RecipeModal';
import Footer from './components/Footer';
import { analyzeImage } from './services/api';

function App() {
  // 状态管理
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('AI正在识别食材中...');
  const [results, setResults] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [error, setError] = useState(null);

  // 处理图片选择
  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData);
    setResults(null);
    setError(null);
  }, []);

  // 移除图片
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setResults(null);
    setError(null);
  }, []);

  // 分析图片
  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      setLoadingText('正在上传图片...');
      const result = await analyzeImage(selectedImage, setLoadingText);
      setResults(result);
    } catch (err) {
      console.error('分析失败:', err);
      setError(err.message || '识别失败，请重试');
      alert('识别失败: ' + (err.message || '请重试'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedImage]);

  // 显示菜谱详情
  const handleShowRecipe = useCallback((recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  // 关闭弹窗
  const handleCloseModal = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <UploadSection
          selectedImage={selectedImage}
          onImageSelect={handleImageSelect}
          onRemoveImage={handleRemoveImage}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />

        {isLoading && <LoadingSection text={loadingText} />}

        {!isLoading && results && (
          <ResultsSection
            ingredients={results.ingredients || []}
            recipes={results.recipes || []}
            nutritionTips={results.nutritionTips}
            onShowRecipe={handleShowRecipe}
          />
        )}

        <RecipeModal
          recipe={selectedRecipe}
          onClose={handleCloseModal}
        />
      </main>

      <Footer />
    </div>
  );
}

export default App;
