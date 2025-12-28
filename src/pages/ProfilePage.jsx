import React, { useState, useEffect, useCallback } from 'react';
import { User, Heart, AlertTriangle, Activity, Save, Edit2 } from 'lucide-react';
import {
  getUserProfile,
  saveUserProfile,
  calculateBMI,
  calculateBMR,
  calculateTDEE,
} from '../services/storageService';

const HEALTH_TAGS = [
  { id: 'hypertension', label: '高血压', icon: '💓' },
  { id: 'hyperlipidemia', label: '高血脂', icon: '🩸' },
  { id: 'diabetes', label: '糖尿病', icon: '🍬' },
  { id: 'gout', label: '痛风', icon: '🦴' },
];

const ALLERGENS = [
  { id: 'seafood', label: '海鲜', icon: '🦐' },
  { id: 'peanut', label: '花生', icon: '🥜' },
  { id: 'milk', label: '牛奶', icon: '🥛' },
  { id: 'egg', label: '鸡蛋', icon: '🥚' },
  { id: 'wheat', label: '小麦', icon: '🌾' },
  { id: 'soy', label: '大豆', icon: '🫘' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: '久坐不动', desc: '几乎不运动' },
  { id: 'light', label: '轻度活动', desc: '每周1-3次运动' },
  { id: 'moderate', label: '中度活动', desc: '每周3-5次运动' },
  { id: 'active', label: '高度活动', desc: '每周6-7次运动' },
  { id: 'veryActive', label: '非常活跃', desc: '每天高强度运动' },
];

const initialProfile = {
  gender: 'male',
  age: '',
  height: '',
  weight: '',
  healthTags: [],
  allergens: [],
  activityLevel: 'light',
};

function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const saved = getUserProfile();
    if (saved) {
      setProfile(saved);
      setHasProfile(true);
    } else {
      setIsEditing(true);
    }
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTagToggle = useCallback((field, tagId) => {
    setProfile((prev) => {
      const current = prev[field] || [];
      const updated = current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId];
      return { ...prev, [field]: updated };
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!profile.age || !profile.height || !profile.weight) {
      alert('请填写完整的基础信息');
      return;
    }
    saveUserProfile(profile);
    setHasProfile(true);
    setIsEditing(false);
  }, [profile]);

  const bmi = calculateBMI(Number(profile.weight), Number(profile.height));
  const bmr = calculateBMR({
    weight: Number(profile.weight),
    height: Number(profile.height),
    age: Number(profile.age),
    gender: profile.gender,
  });
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return { text: '偏瘦', color: 'text-blue-500', bg: 'bg-blue-50' };
    if (bmi < 24) return { text: '正常', color: 'text-green-500', bg: 'bg-green-50' };
    if (bmi < 28) return { text: '超重', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    return { text: '肥胖', color: 'text-red-500', bg: 'bg-red-50' };
  };

  const bmiStatus = getBMIStatus(bmi);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-primary to-green-400 text-white p-6 rounded-b-[30px] shadow-card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={28} />
            <h1 className="text-2xl font-bold">健康档案</h1>
          </div>
          {hasProfile && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
            >
              <Edit2 size={14} />
              编辑
            </button>
          )}
        </div>
        <p className="text-sm opacity-90 mt-2">记录您的健康数据，获得个性化饮食建议</p>
      </div>

      <div className="px-4 space-y-4">
        {/* 基础信息卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-card animate-slide-up">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-800">
            <span className="text-xl">📋</span>
            基础信息
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">性别</label>
              <div className="flex gap-2">
                {[
                  { id: 'male', label: '男', icon: '👨' },
                  { id: 'female', label: '女', icon: '👩' },
                ].map((g) => (
                  <button
                    key={g.id}
                    disabled={!isEditing}
                    onClick={() => handleInputChange('gender', g.id)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      profile.gender === g.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {g.icon} {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">年龄</label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                disabled={!isEditing}
                placeholder="请输入"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">身高 (cm)</label>
              <input
                type="number"
                value={profile.height}
                onChange={(e) => handleInputChange('height', e.target.value)}
                disabled={!isEditing}
                placeholder="请输入"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">体重 (kg)</label>
              <input
                type="number"
                value={profile.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                disabled={!isEditing}
                placeholder="请输入"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-600"
              />
            </div>
          </div>

          {/* 活动水平 */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-2">活动水平</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  disabled={!isEditing}
                  onClick={() => handleInputChange('activityLevel', level.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    profile.activityLevel === level.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 健康指标卡片 */}
        {hasProfile && bmi > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-4 shadow-card animate-slide-up">
            <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-800">
              <Activity size={20} className="text-primary" />
              健康指标
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className={`${bmiStatus.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-bold ${bmiStatus.color}`}>{bmi}</div>
                <div className="text-xs text-gray-500">BMI</div>
                <div className={`text-xs font-medium ${bmiStatus.color}`}>{bmiStatus.text}</div>
              </div>

              <div className="bg-orange-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-orange-500">{bmr}</div>
                <div className="text-xs text-gray-500">BMR</div>
                <div className="text-xs text-orange-500">基础代谢</div>
              </div>

              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-purple-500">{tdee}</div>
                <div className="text-xs text-gray-500">TDEE</div>
                <div className="text-xs text-purple-500">每日热量</div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              建议每日摄入 {tdee} 千卡热量以维持当前体重
            </p>
          </div>
        )}

        {/* 健康标签卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-card animate-slide-up">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-800">
            <Heart size={20} className="text-red-400" />
            健康状况（可多选）
          </h3>

          <div className="flex flex-wrap gap-2">
            {HEALTH_TAGS.map((tag) => (
              <button
                key={tag.id}
                disabled={!isEditing}
                onClick={() => handleTagToggle('healthTags', tag.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  profile.healthTags?.includes(tag.id)
                    ? 'bg-red-100 text-red-600 border-2 border-red-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span>{tag.icon}</span>
                {tag.label}
              </button>
            ))}
          </div>

          {profile.healthTags?.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">暂无健康问题，太棒了！</p>
          )}
        </div>

        {/* 过敏源卡片 */}
        <div className="bg-white rounded-xl p-4 shadow-card animate-slide-up">
          <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-800">
            <AlertTriangle size={20} className="text-yellow-500" />
            过敏源（可多选）
          </h3>

          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((allergen) => (
              <button
                key={allergen.id}
                disabled={!isEditing}
                onClick={() => handleTagToggle('allergens', allergen.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  profile.allergens?.includes(allergen.id)
                    ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                    : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span>{allergen.icon}</span>
                {allergen.label}
              </button>
            ))}
          </div>

          {profile.allergens?.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">暂无过敏源</p>
          )}
        </div>

        {/* 保存按钮 */}
        {isEditing && (
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-primary to-green-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
          >
            <Save size={18} />
            保存档案
          </button>
        )}

        {/* 免责声明 */}
        <p className="text-xs text-gray-400 text-center pb-4">
          ⚠️ AI估算仅供参考，不可作为医疗诊断依据
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;
