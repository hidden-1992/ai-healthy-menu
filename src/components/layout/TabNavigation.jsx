import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChefHat, User, Utensils, Sparkles } from 'lucide-react';

const tabs = [
  { path: '/', icon: ChefHat, label: '智能厨师' },
  { path: '/profile', icon: User, label: '健康档案' },
  { path: '/assessment', icon: Utensils, label: '膳食评估' },
  { path: '/scene', icon: Sparkles, label: '场景推荐' },
];

function TabNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="max-w-[480px] mx-auto flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1.5 rounded-xl transition-all duration-300 ${
                    isActive ? 'bg-primary-50 scale-110' : ''
                  }`}
                >
                  <tab.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all duration-300"
                  />
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-medium transition-all duration-300 ${
                    isActive ? 'font-semibold' : ''
                  }`}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default TabNavigation;
