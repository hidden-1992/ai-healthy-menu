import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Camera, Plus, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import {
  getUserProfile,
  getMealRecords,
  addMealRecord,
  deleteMealRecord,
  calculateTDEE,
  calculateBMR,
} from '../services/storageService';
import { analyzeFoodImage } from '../services/api';
import { readAndCompressImage } from '../utils/imageCompress';

const MEAL_TYPES = [
  { id: 'breakfast', label: '早餐', icon: '🌅', time: '7:00-9:00' },
  { id: 'lunch', label: '午餐', icon: '☀️', time: '11:30-13:00' },
  { id: 'dinner', label: '晚餐', icon: '🌙', time: '18:00-20:00' },
  { id: 'snack', label: '加餐', icon: '🍪', time: '其他时间' },
];

function AssessmentPage() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState(() => getMealRecords(currentDate));
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('lunch');
  const fileInputRef = useRef(null);

  const userProfile = getUserProfile();

  const tdee = useMemo(() => {
    if (!userProfile) return 2000;
    const bmr = calculateBMR({
      weight: Number(userProfile.weight),
      height: Number(userProfile.height),
      age: Number(userProfile.age),
      gender: userProfile.gender,
    });
    return calculateTDEE(bmr, userProfile.activityLevel);
  }, [userProfile]);

  const totalNutrition = useMemo(() => {
    return records.reduce(
      (acc, record) => ({
        calories: acc.calories + (record.calories || 0),
        protein: acc.protein + (record.protein || 0),
        carbs: acc.carbs + (record.carbs || 0),
        fat: acc.fat + (record.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [records]);

  const handleDateChange = useCallback((offset) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + offset);
    const newDate = date.toISOString().split('T')[0];
    setCurrentDate(newDate);
    setRecords(getMealRecords(newDate));
  }, [currentDate]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return '今天';
    if (dateStr === yesterday) return '昨天';
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setShowAddModal(false);

    try {
      // 压缩图片
      const imageData = await readAndCompressImage(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
      });

      const result = await analyzeFoodImage(imageData, userProfile);
      
      if (result && !result.error) {
        const newRecord = {
          mealType: selectedMealType,
          name: result.name || '未知食物',
          image: imageData,
          calories: result.calories || 0,
          protein: result.protein || 0,
          carbs: result.carbs || 0,
          fat: result.fat || 0,
          weight: result.weight || 100,
          healthLevel: result.healthLevel || 'yellow',
          advice: result.advice || '',
        };
        
        addMealRecord(currentDate, newRecord);
        setRecords(getMealRecords(currentDate));
      } else {
        alert('识别失败：' + (result?.error || '请重试'));
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      alert('处理图片失败，请重试');
    }
    
    setIsAnalyzing(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [currentDate, selectedMealType, userProfile]);

  const handleDeleteRecord = useCallback((recordId) => {
    if (window.confirm('确定删除这条记录吗？')) {
      deleteMealRecord(currentDate, recordId);
      setRecords(getMealRecords(currentDate));
    }
  }, [currentDate]);

  const getHealthLevelStyle = (level) => {
    switch (level) {
      case 'green': return { bg: 'bg-green-100', text: 'text-green-600', label: '推荐', icon: '🟢' };
      case 'yellow': return { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '适量', icon: '🟡' };
      case 'red': return { bg: 'bg-red-100', text: 'text-red-600', label: '警告', icon: '🔴' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: '未知', icon: '⚪' };
    }
  };

  const caloriePercentage = Math.min((totalNutrition.calories / tdee) * 100, 100);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-primary to-green-400 text-white p-6 rounded-b-[30px] shadow-card mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-3xl">🍽️</span>
          <h1 className="text-2xl font-bold">膳食评估</h1>
        </div>
        <p className="text-sm opacity-90">记录饮食，AI 智能分析营养摄入</p>
      </div>

      <div className="px-4 space-y-4">
        {/* 日期选择器 */}
        <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-card">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-semibold text-gray-800">{formatDate(currentDate)}</span>
          <button
            onClick={() => handleDateChange(1)}
            disabled={currentDate >= new Date().toISOString().split('T')[0]}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 热量进度卡片 */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 shadow-card">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">今日热量摄入</span>
            <span className="text-xs text-gray-500">目标 {tdee} kcal</span>
          </div>
          
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-bold text-orange-500">{totalNutrition.calories}</span>
            <span className="text-sm text-gray-500 mb-1">/ {tdee} kcal</span>
          </div>

          <div className="h-3 bg-white/80 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                caloriePercentage > 100 ? 'bg-red-400' : 'bg-gradient-to-r from-orange-400 to-yellow-400'
              }`}
              style={{ width: `${caloriePercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-500">{totalNutrition.protein}g</div>
              <div className="text-xs text-gray-500">蛋白质</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-500">{totalNutrition.carbs}g</div>
              <div className="text-xs text-gray-500">碳水</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-500">{totalNutrition.fat}g</div>
              <div className="text-xs text-gray-500">脂肪</div>
            </div>
          </div>
        </div>

        {/* 餐次记录 */}
        {MEAL_TYPES.map((mealType) => {
          const mealRecords = records.filter((r) => r.mealType === mealType.id);
          
          return (
            <div key={mealType.id} className="bg-white rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{mealType.icon}</span>
                  <span className="font-semibold text-gray-800">{mealType.label}</span>
                  <span className="text-xs text-gray-400">{mealType.time}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedMealType(mealType.id);
                    setShowAddModal(true);
                  }}
                  className="p-1.5 bg-primary-50 text-primary rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              {mealRecords.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  暂无记录，点击 + 添加
                </div>
              ) : (
                <div className="space-y-2">
                  {mealRecords.map((record) => {
                    const levelStyle = getHealthLevelStyle(record.healthLevel);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                      >
                        {record.image && (
                          <img
                            src={record.image}
                            alt={record.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 truncate">{record.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${levelStyle.bg} ${levelStyle.text}`}>
                              {levelStyle.icon} {levelStyle.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.calories} kcal · {record.weight}g
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 个性化建议 */}
        {records.length > 0 && records.some((r) => r.advice) && (
          <div className="bg-blue-50 rounded-xl p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-3 text-gray-800">
              <AlertCircle size={18} className="text-blue-500" />
              AI 饮食建议
            </h3>
            <div className="space-y-2">
              {records
                .filter((r) => r.advice)
                .map((record) => (
                  <p key={record.id} className="text-sm text-gray-600">
                    • {record.advice}
                  </p>
                ))}
            </div>
          </div>
        )}

        {/* 免责声明 */}
        <p className="text-xs text-gray-400 text-center pb-4">
          ⚠️ AI估算仅供参考，不可作为医疗诊断依据
        </p>
      </div>

      {/* 添加记录弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in">
          <div className="bg-white w-full max-w-[480px] rounded-t-3xl p-6 animate-slide-up">
            <h3 className="text-lg font-semibold text-center mb-4">
              添加{MEAL_TYPES.find((m) => m.id === selectedMealType)?.label}记录
            </h3>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 bg-gradient-to-r from-primary to-green-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 mb-3"
            >
              <Camera size={20} />
              拍照识别
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 分析中遮罩 */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">AI 正在分析食物...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentPage;
