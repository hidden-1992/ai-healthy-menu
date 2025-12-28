import React from 'react';
import IngredientsCard from './IngredientsCard';
import RecipesCard from './RecipesCard';
import NutritionCard from './NutritionCard';

function ResultsSection({ ingredients, recipes, nutritionTips, onShowRecipe }) {
  return (
    <div className="results-section">
      <IngredientsCard ingredients={ingredients} />
      <RecipesCard recipes={recipes} onShowRecipe={onShowRecipe} />
      <NutritionCard nutritionTips={nutritionTips} recipes={recipes} />
    </div>
  );
}

export default ResultsSection;
