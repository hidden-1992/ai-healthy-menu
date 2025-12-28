import React, { useState, useCallback } from 'react';
import UploadSection from '../components/UploadSection';
import LoadingSection from '../components/LoadingSection';
import ResultsSection from '../components/ResultsSection';
import RecipeModal from '../components/RecipeModal';
import { analyzeImage } from '../services/api';
import { getUserProfile } from '../services/storageService';

function HomePage() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('AI正在识别食材中...');
  const [results, setResults] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [error, setError] = useState(null);

  const handleImageSelect = useCallback((imageData) => {
    setSelectedImage(imageData);
    setResults(null);
    setError(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
    setResults(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setError(null);

    const userProfile = getUserProfile();

    setLoadingText('正在上传图片...');
    const result = await analyzeImage(selectedImage, setLoadingText, userProfile);
    
    if (result.error) {
      console.error('分析失败:', result.error);
      setError(result.error);
      alert('识别失败: ' + result.error);
    } else {
      setResults(result);
    }
    
    setIsLoading(false);
  }, [selectedImage]);

  const handleShowRecipe = useCallback((recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedRecipe(null);
  }, []);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-primary to-green-400 text-white p-6 rounded-b-[30px] shadow-card mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl animate-bounce-slow">🍳</span>
          <h1 className="text-2xl font-bold tracking-wider">智能厨师</h1>
        </div>
        <p className="text-center text-sm opacity-90">拍照识别食材，智能推荐健康菜谱</p>
      </div>

      <div className="px-4">
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

        <RecipeModal recipe={selectedRecipe} onClose={handleCloseModal} />
      </div>
    </div>
  );
}

export default HomePage;
