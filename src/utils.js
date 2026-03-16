/**
 * 计算物品总成本（基础价格 + 附加成本）
 * @param {Object} item - 物品数据
 * @returns {number} 总成本
 */
export const getTotalCost = (item) => {
  const basePrice = item.price || 0;
  const extraCost = (item.additionalCosts || []).reduce((sum, curr) => sum + (curr.amt || 0), 0);
  return basePrice + extraCost;
};

/**
 * 计算长期物品日成本
 * @param {Object} item - 物品数据
 * @returns {string} 日成本（保留2位小数）
 */
export const getDayCost = (item) => {
  if (!item.purchaseDate) return "0.00";
  const buyDate = new Date(item.purchaseDate);
  const today = new Date();
  const days = Math.max(1, Math.floor((today - buyDate) / (1000 * 60 * 60 * 24)));
  return (getTotalCost(item) / days).toFixed(2);
};

/**
 * 计算消耗品次成本
 * @param {Object} item - 物品数据
 * @returns {string} 次成本（保留2位小数）
 */
export const getUseCost = (item) => {
  if (item.type !== "consume") return "0.00";
  const total = getTotalCost(item);
  const count = Math.max(1, item.usedCount || 0);
  return (total / count).toFixed(2);
};

/**
 * 计算消耗品剩余数量
 * @param {Object} item - 物品数据
 * @returns {string} 剩余数量/总数量
 */
export const getRemainingQuantity = (item) => {
  if (item.type !== "consume" || !item.quantity) return "-";
  const remaining = Math.max(0, item.quantity - (item.usedCount || 0));
  return `${remaining}/${item.quantity}`;
};

/**
 * 计算财务统计数据
 * @param {Array} transactions - 记账记录数组
 * @returns {Object} 支出、收入、余额
 */
export const getFinanceStats = (transactions) => {
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0)
    .toFixed(2);
  
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0)
    .toFixed(2);
  
  const balance = (totalIncome - totalExpense).toFixed(2);
  
  return { totalExpense, totalIncome, balance };
};

/**
 * 安全解析localStorage数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值
 * @returns {any} 解析后的数据或默认值
 */
export const safeParseStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.log(`读取${key}数据失败`, e);
    return defaultValue;
  }
};