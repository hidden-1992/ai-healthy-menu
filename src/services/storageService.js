/**
 * localStorage 存储服务
 * 封装本地存储操作
 */

const STORAGE_KEYS = {
  USER_PROFILE: 'huishi_user_profile',
  MEAL_RECORDS: 'huishi_meal_records',
  SETTINGS: 'huishi_settings',
};

/**
 * 获取存储数据
 * @param {string} key - 存储键名
 * @returns {any} 解析后的数据
 */
export function get(key) {
  const data = localStorage.getItem(key);
  if (!data) return null;
  return JSON.parse(data);
}

/**
 * 设置存储数据
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的数据
 */
export function set(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 删除存储数据
 * @param {string} key - 存储键名
 */
export function remove(key) {
  localStorage.removeItem(key);
}

/**
 * 获取用户健康档案
 * @returns {Object|null} 用户档案数据
 */
export function getUserProfile() {
  return get(STORAGE_KEYS.USER_PROFILE);
}

/**
 * 保存用户健康档案
 * @param {Object} profile - 用户档案数据
 */
export function saveUserProfile(profile) {
  set(STORAGE_KEYS.USER_PROFILE, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 获取饮食记录
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @returns {Array} 当日饮食记录
 */
export function getMealRecords(date) {
  const records = get(STORAGE_KEYS.MEAL_RECORDS) || {};
  return records[date] || [];
}

/**
 * 保存饮食记录
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @param {Array} meals - 饮食记录数组
 */
export function saveMealRecords(date, meals) {
  const records = get(STORAGE_KEYS.MEAL_RECORDS) || {};
  records[date] = meals;
  set(STORAGE_KEYS.MEAL_RECORDS, records);
}

/**
 * 添加单条饮食记录
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @param {Object} meal - 饮食记录
 */
export function addMealRecord(date, meal) {
  const records = getMealRecords(date);
  records.push({
    ...meal,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  });
  saveMealRecords(date, records);
}

/**
 * 删除饮食记录
 * @param {string} date - 日期字符串 YYYY-MM-DD
 * @param {string} mealId - 记录ID
 */
export function deleteMealRecord(date, mealId) {
  const records = getMealRecords(date);
  const filtered = records.filter((r) => r.id !== mealId);
  saveMealRecords(date, filtered);
}

/**
 * 计算 BMI
 * @param {number} weight - 体重(kg)
 * @param {number} height - 身高(cm)
 * @returns {number} BMI值
 */
export function calculateBMI(weight, height) {
  if (!weight || !height) return 0;
  const heightM = height / 100;
  return Number((weight / (heightM * heightM)).toFixed(1));
}

/**
 * 计算 BMR (基础代谢率) - Mifflin-St Jeor 公式
 * @param {Object} params - 参数对象
 * @returns {number} BMR值 (kcal/day)
 */
export function calculateBMR({ weight, height, age, gender }) {
  if (!weight || !height || !age) return 0;
  
  // Mifflin-St Jeor 公式
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * 计算 TDEE (每日总能量消耗)
 * @param {number} bmr - 基础代谢率
 * @param {string} activityLevel - 活动水平
 * @returns {number} TDEE值 (kcal/day)
 */
export function calculateTDEE(bmr, activityLevel = 'light') {
  const multipliers = {
    sedentary: 1.2,    // 久坐不动
    light: 1.375,      // 轻度活动
    moderate: 1.55,    // 中度活动
    active: 1.725,     // 高度活动
    veryActive: 1.9,   // 非常活跃
  };
  
  return Math.round(bmr * (multipliers[activityLevel] || 1.375));
}

export { STORAGE_KEYS };
