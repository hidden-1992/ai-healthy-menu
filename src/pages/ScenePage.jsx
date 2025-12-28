import React, { useState, useCallback, useMemo } from 'react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { getUserProfile } from '../services/storageService';
import { getSceneRecommendation } from '../services/api';

const SCENES = [
  {
    id: 'cold',
    icon: '🤧',
    label: '感冒/发烧',
    desc: '身体不适需要恢复',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'drunk',
    icon: '🍺',
    label: '刚饮酒',
    desc: '需要解酒护肝',
    color: 'from-amber-400 to-orange-400',
  },
  {
    id: 'exercise',
    icon: '🏋️',
    label: '刚运动',
    desc: '需要补充能量',
    color: 'from-green-400 to-emerald-400',
  },
  {
    id: 'period',
    icon: '🩸',
    label: '生理期',
    desc: '需要温补调理',
    color: 'from-pink-400 to-rose-400',
  },
  {
    id: 'tired',
    icon: '😴',
    label: '疲劳困倦',
    desc: '需要提神醒脑',
    color: 'from-purple-400 to-violet-400',
  },
  {
    id: 'stomach',
    icon: '🤢',
    label: '肠胃不适',
    desc: '需要养胃调理',
    color: 'from-teal-400 to-cyan-400',
  },
];

function ScenePage() {
  const [selectedScene, setSelectedScene] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const userProfile = getUserProfile();

  const handleSceneSelect = useCallback(async (scene) => {
    setSelectedScene(scene.id);
    setIsLoading(true);
    setRecommendation(null);

    const result = await getSceneRecommendation(scene, userProfile);
    
    if (result && !result.error) {
      setRecommendation(result);
    } else {
      alert('获取推荐失败：' + (result?.error || '请重试'));
    }
    
    setIsLoading(false);
  }, [userProfile]);

  const selectedSceneData = useMemo(() => {
    return SCENES.find((s) => s.id === selectedScene);
  }, [selectedScene]);

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-primary to-green-400 text-white p-6 rounded-b-[30px] shadow-card mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={28} />
          <h1 className="text-2xl font-bold">场景推荐</h1>
        </div>
        <p className="text-sm opacity-90">选择当前状态，获取专属饮食建议</p>
      </div>

      <div className="px-4 space-y-4">
        {/* 场景选择 */}
        <div className="bg-white rounded-xl p-4 shadow-card">
          <h3 className="text-base font-semibold mb-4 text-gray-800">我现在...</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {SCENES.map((scene) => (
              <button
                key={scene.id}
                onClick={() => handleSceneSelect(scene)}
                disabled={isLoading}
                className={`relative p-4 rounded-xl text-left transition-all ${
                  selectedScene === scene.id
                    ? `bg-gradient-to-br ${scene.color} text-white shadow-lg scale-[1.02]`
                    : 'bg-gray-50 hover:bg-gray-100'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-3xl mb-2 block">{scene.icon}</span>
                <div className={`font-semibold ${selectedScene === scene.id ? 'text-white' : 'text-gray-800'}`}>
                  {scene.label}
                </div>
                <div className={`text-xs mt-0.5 ${selectedScene === scene.id ? 'text-white/80' : 'text-gray-500'}`}>
                  {scene.desc}
                </div>
                {selectedScene === scene.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-white/30 rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 加载状态 */}
        {isLoading && (
          <div className="bg-white rounded-xl p-8 shadow-card text-center">
            <Loader2 size={40} className="text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">AI 正在为您生成专属建议...</p>
          </div>
        )}

        {/* 推荐结果 */}
        {!isLoading && recommendation && selectedSceneData && (
          <>
            {/* 推荐食物 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 shadow-card animate-slide-up">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-800">
                <Check size={20} className="text-green-500" />
                推荐食物清单
              </h3>
              
              <div className="space-y-3">
                {recommendation.recommended?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg"
                  >
                    <span className="text-2xl">{item.icon || '🍽️'}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 禁忌食物 */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 shadow-card animate-slide-up">
              <h3 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-800">
                <X size={20} className="text-red-500" />
                禁忌食物清单
              </h3>
              
              <div className="space-y-3">
                {recommendation.forbidden?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg"
                  >
                    <span className="text-2xl">{item.icon || '🚫'}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 温馨提示 */}
            {recommendation.tips && (
              <div className="bg-blue-50 rounded-xl p-4 shadow-card animate-slide-up">
                <h3 className="flex items-center gap-2 text-base font-semibold mb-3 text-gray-800">
                  💡 温馨提示
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{recommendation.tips}</p>
              </div>
            )}
          </>
        )}

        {/* 空状态 */}
        {!isLoading && !recommendation && (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <span className="text-5xl mb-4 block">🤔</span>
            <p className="text-gray-500">选择上方场景，获取专属饮食建议</p>
          </div>
        )}

        {/* 免责声明 */}
        <p className="text-xs text-gray-400 text-center pb-4">
          ⚠️ AI建议仅供参考，如有严重不适请及时就医
        </p>
      </div>
    </div>
  );
}

export default ScenePage;
