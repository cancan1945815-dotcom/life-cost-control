// 版本配置
export const CURRENT_VERSION = "4.0.0";
export const VERSION_STORAGE_KEY = "MY_APP_VERSION";
export const REMOTE_VERSION_URL = "https://raw.githubusercontent.com/your-username/your-repo/main/version.json";

// 本地存储键名
export const STORAGE_KEYS = {
  ITEMS: "MY_LIFE_COST_ITEMS",
  OUTFIT_HISTORY: "MY_OUTFIT_HISTORY",
  TRANSACTIONS: "MY_TRANSACTIONS",
  CATEGORIES: "MY_APP_CATEGORIES",
  RECENT_CATEGORY: "MY_APP_RECENT_CATEGORY"
};

// 默认分类
export const DEFAULT_CATEGORIES = ["服饰", "电子产品", "食品", "日用品", "其他"];

// 记账分类
export const TRANSACTION_CATEGORIES = {
  expense: ["日常消费", "餐饮", "购物", "交通", "娱乐", "房租", "水电费", "其他支出"],
  income: ["工资", "兼职", "理财", "红包", "其他收入"]
};