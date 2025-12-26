import React from 'react';

function IngredientsCard({ ingredients }) {
  if (!ingredients || ingredients.length === 0) {
    return (
      <div className="card ingredients-card">
        <h2 className="card-title">
          <span className="title-icon">🥬</span>
          识别到的食材
        </h2>
        <p style={{ color: '#999', textAlign: 'center' }}>未识别到食材</p>
      </div>
    );
  }

  return (
    <div className="card ingredients-card">
      <h2 className="card-title">
        <span className="title-icon">🥬</span>
        识别到的食材
      </h2>
      <div className="ingredients-list">
        {ingredients.map((ingredient, index) => {
          const isMain = index < 3;
          return (
            <span
              key={index}
              className={`ingredient-tag ${isMain ? 'main-ingredient' : ''}`}
              title={`置信度: ${ingredient.confidence || '未知'} | 占比: ${ingredient.proportion || '未知'}`}
            >
              <span className="ingredient-icon">{ingredient.icon || '🥬'}</span>
              {ingredient.name}
              {isMain && <span className="main-badge">主要</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default IngredientsCard;
