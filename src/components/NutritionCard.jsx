import React, { useMemo } from 'react';

// 每日推荐摄入量参考（成人）
const DAILY_REFERENCE = {
  protein: 65,    // 克
  carbs: 300,     // 克
  fat: 60,        // 克
  calories: 2000  // 千卡
};

// 默认营养建议
const DEFAULT_TIPS = {
  balance: '请上传食材图片以获取营养建议',
  cooking: '建议采用蒸、煮、炒等低油烹饪方式',
  warning: '注意控制盐分摄入'
};

function NutritionCard({ nutritionTips, recipes }) {
  const tips = nutritionTips || DEFAULT_TIPS;

  // 计算总营养数据
  const totalNutrition = useMemo(() => {
    const total = { protein: 0, carbs: 0, fat: 0, calories: 0 };
    
    if (recipes?.length > 0) {
      recipes.forEach(recipe => {
        if (recipe.nutrition) {
          total.protein += recipe.nutrition.protein || 0;
          total.carbs += recipe.nutrition.carbs || 0;
          total.fat += recipe.nutrition.fat || 0;
          total.calories += recipe.nutrition.calories || 0;
        }
      });
    }
    
    return total;
  }, [recipes]);

  // 计算占每日推荐的百分比
  const percentages = useMemo(() => ({
    protein: Math.min(100, Math.round((totalNutrition.protein / DAILY_REFERENCE.protein) * 100)),
    carbs: Math.min(100, Math.round((totalNutrition.carbs / DAILY_REFERENCE.carbs) * 100)),
    fat: Math.min(100, Math.round((totalNutrition.fat / DAILY_REFERENCE.fat) * 100)),
    calories: Math.min(100, Math.round((totalNutrition.calories / DAILY_REFERENCE.calories) * 100))
  }), [totalNutrition]);

  const recipeCount = recipes?.length || 0;

  return (
    <div className="card nutrition-card">
      <h2 className="card-title">
        <span className="title-icon">💪</span>
        营养搭配建议
      </h2>
      <div className="nutrition-content">
        {/* 营养建议项 */}
        <NutritionItem icon="🥗" title="均衡搭配" content={tips.balance} />
        <NutritionItem icon="💡" title="烹饪建议" content={tips.cooking} />
        <NutritionItem icon="⚠️" title="注意事项" content={tips.warning} />

        {/* 营养汇总 */}
        <div className="nutrition-bar">
          <h4>📊 推荐菜谱营养汇总</h4>
          <p className="nutrition-subtitle">
            如果制作全部 {recipeCount} 道推荐菜品，预计营养摄入：
          </p>
          
          <div className="nutrition-summary">
            <NutritionStat value={totalNutrition.calories} label="千卡" />
            <NutritionStat value={`${totalNutrition.protein}g`} label="蛋白质" />
            <NutritionStat value={`${totalNutrition.carbs}g`} label="碳水" />
            <NutritionStat value={`${totalNutrition.fat}g`} label="脂肪" />
          </div>

          <p className="nutrition-reference">占每日推荐摄入量百分比（成人参考）：</p>
          
          <NutritionBar
            label="蛋白质"
            current={totalNutrition.protein}
            reference={DAILY_REFERENCE.protein}
            percentage={percentages.protein}
            type="protein"
          />
          <NutritionBar
            label="碳水化合物"
            current={totalNutrition.carbs}
            reference={DAILY_REFERENCE.carbs}
            percentage={percentages.carbs}
            type="carbs"
          />
          <NutritionBar
            label="脂肪"
            current={totalNutrition.fat}
            reference={DAILY_REFERENCE.fat}
            percentage={percentages.fat}
            type="fat"
          />
          <NutritionBar
            label="热量"
            current={totalNutrition.calories}
            reference={DAILY_REFERENCE.calories}
            percentage={percentages.calories}
            type="calories"
            unit="千卡"
          />
        </div>
      </div>
    </div>
  );
}

// 营养建议项组件
function NutritionItem({ icon, title, content }) {
  return (
    <div className="nutrition-item">
      <span className="nutrition-icon">{icon}</span>
      <div className="nutrition-info">
        <h4>{title}</h4>
        <p>{content}</p>
      </div>
    </div>
  );
}

// 营养统计组件
function NutritionStat({ value, label }) {
  return (
    <div className="nutrition-stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

// 营养进度条组件
function NutritionBar({ label, current, reference, percentage, type, unit = 'g' }) {
  return (
    <div className="bar-item">
      <div className="bar-label">
        <span>{label} ({current}{unit} / {reference}{unit})</span>
        <span>{percentage}%</span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${type}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default NutritionCard;
