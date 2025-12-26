import React, { useEffect } from 'react';

function RecipeModal({ recipe, onClose }) {
  // 处理 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (recipe) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [recipe, onClose]);

  if (!recipe) return null;

  const nutrition = recipe.nutrition || { protein: 0, carbs: 0, fat: 0, calories: 0 };
  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];

  // 点击背景关闭
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal show" onClick={handleBackdropClick}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-body">
          {/* 头部图标 */}
          <div className="recipe-detail-header">
            <span className="recipe-detail-icon">{recipe.icon || '🍳'}</span>
          </div>

          {/* 内容区 */}
          <div className="recipe-detail-content">
            <h3 className="recipe-detail-title">{recipe.name}</h3>
            
            <div className="recipe-detail-meta">
              <span>⏱️ {recipe.time || '未知'}</span>
              <span className={`difficulty ${recipe.difficulty || 'easy'}`}>
                {recipe.difficultyText || '简单'}
              </span>
              <span>🔥 {nutrition.calories}千卡</span>
            </div>

            {/* 所需食材 */}
            <div className="recipe-detail-section">
              <h4>📝 所需食材</h4>
              <ul>
                {ingredients.map((ing, index) => (
                  <li key={index}>• {ing}</li>
                ))}
              </ul>
            </div>

            {/* 烹饪步骤 */}
            <div className="recipe-detail-section">
              <h4>👨‍🍳 烹饪步骤</h4>
              <ul>
                {steps.map((step, index) => (
                  <li key={index}>
                    <span className="step-number">{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* 营养成分 */}
            <div className="recipe-detail-section">
              <h4>📊 营养成分（每份）</h4>
              <ul>
                <li>• 蛋白质: {nutrition.protein}g</li>
                <li>• 碳水化合物: {nutrition.carbs}g</li>
                <li>• 脂肪: {nutrition.fat}g</li>
                <li>• 热量: {nutrition.calories}千卡</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeModal;
