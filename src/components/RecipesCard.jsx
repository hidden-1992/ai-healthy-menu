import React from 'react';

function RecipesCard({ recipes, onShowRecipe }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="card recipes-card">
        <h2 className="card-title">
          <span className="title-icon">📖</span>
          推荐菜谱
        </h2>
        <p style={{ color: '#999', textAlign: 'center' }}>暂无推荐菜谱</p>
      </div>
    );
  }

  return (
    <div className="card recipes-card">
      <h2 className="card-title">
        <span className="title-icon">📖</span>
        推荐菜谱
      </h2>
      <div className="recipes-list">
        {recipes.map((recipe, index) => (
          <div
            key={index}
            className="recipe-item"
            onClick={() => onShowRecipe(recipe)}
          >
            <span className="recipe-icon">{recipe.icon || '🍳'}</span>
            <div className="recipe-info">
              <div className="recipe-name">{recipe.name}</div>
              <div className="recipe-meta">
                <span>⏱️ {recipe.time || '未知'}</span>
                <span className={`difficulty ${recipe.difficulty || 'easy'}`}>
                  {recipe.difficultyText || '简单'}
                </span>
              </div>
            </div>
            <span className="recipe-arrow">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecipesCard;
