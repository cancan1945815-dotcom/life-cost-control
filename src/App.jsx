import React, { useState, useEffect, useRef } from "react";

// 版本配置
const CURRENT_VERSION = "4.2.0";
const VERSION_STORAGE_KEY = "MY_APP_VERSION";

export default function App() {
  // ========== 核心数据状态 ==========
  // 物品数据（本地持久化）
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_LIFE_COST_ITEMS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取物品数据失败，使用空列表", e);
      return [];
    }
  });

  // 穿搭记录（本地持久化）
  const [outfitHistory, setOutfitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_OUTFIT_HISTORY");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取穿搭数据失败，使用空列表", e);
      return [];
    }
  });

  // 记账数据（本地持久化）
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_TRANSACTIONS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取记账数据失败，使用空列表", e);
      return [];
    }
  });

  // 分类数据（本地持久化）
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_APP_CATEGORIES");
      return saved ? JSON.parse(saved) : ["服饰", "电子产品", "食品", "日用品", "其他"];
    } catch (e) {
      console.log("读取分类数据失败，使用默认分类", e);
      return ["服饰", "电子产品", "食品", "日用品", "其他"];
    }
  });

  // 最近使用的分类（本地持久化）
  const [recentCategory, setRecentCategory] = useState(() => {
    try {
      return localStorage.getItem("MY_APP_RECENT_CATEGORY") || "服饰";
    } catch (e) {
      return "服饰";
    }
  });

  // ========== 表单状态 ==========
  // 物品添加表单
  const [name, setName] = useState("");
  const [priceExpr, setPriceExpr] = useState(""); // 价格表达式（支持加减乘除）
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [image, setImage] = useState(null);

  // 编辑弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);

  // 记账表单状态
  const [transType, setTransType] = useState("expense"); // expense | income
  const [transAmount, setTransAmount] = useState("");
  const [transCategory, setTransCategory] = useState("日常消费");
  const [transDate, setTransDate] = useState(new Date().toISOString().split("T")[0]);
  const [transNote, setTransNote] = useState("");

  // ========== 辅助状态 ==========
  const [activeTab, setActiveTab] = useState("items"); // items | outfit | finance
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({}); // 分类折叠状态（默认全折叠）
  const [itemCollapsed, setItemCollapsed] = useState({}); // 物品卡片折叠状态（默认全折叠）
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);
  const [importStatus, setImportStatus] = useState("");
  
  // 文件导入ref
  const fileInputRef = useRef(null);

  // ========== 本地存储副作用 ==========
  useEffect(() => {
    localStorage.setItem("MY_LIFE_COST_ITEMS", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("MY_OUTFIT_HISTORY", JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  useEffect(() => {
    localStorage.setItem("MY_TRANSACTIONS", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("MY_APP_CATEGORIES", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("MY_APP_RECENT_CATEGORY", recentCategory);
  }, [recentCategory]);

  // ========== 初始化（全部折叠） ==========
  useEffect(() => {
    // 初始化分类折叠状态（全部折叠）
    const initialCollapsed = {};
    categories.forEach(cat => {
      initialCollapsed[cat] = true;
    });
    setCollapsed(initialCollapsed);

    // 初始化物品卡片折叠状态（全部折叠）
    const initialItemCollapsed = {};
    items.forEach(item => {
      initialItemCollapsed[item.id] = true;
    });
    setItemCollapsed(initialItemCollapsed);

    // 设置最近使用的分类
    setCategory(recentCategory);

    // 版本记录
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
  }, [categories, items, recentCategory]);

  // ========== 核心工具函数 ==========
  // 安全计算价格表达式（支持加减乘除）
  const calculatePrice = (expression) => {
    if (!expression) return null;
    try {
      // 过滤非法字符，只保留数字、运算符和小数点
      const cleanExpr = expression.replace(/[^-()\d/*+.]/g, "");
      // 安全执行表达式（避免注入风险）
      const result = Function(`'use strict'; return (${cleanExpr})`)();
      // 验证结果是否为有效数字
      if (isNaN(result) || !isFinite(result) || result < 0) {
        return null;
      }
      return parseFloat(result.toFixed(2));
    } catch (error) {
      console.log("价格计算失败：", error);
      return null;
    }
  };

  // 数据导入导出
  const exportData = () => {
    const exportData = {
      items,
      outfitHistory,
      transactions,
      categories,
      exportTime: new Date().toISOString(),
      version: CURRENT_VERSION
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `物品管理数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const importedData = JSON.parse(ev.target.result);
        
        // 合并物品数据（去重）
        const newItems = [...items];
        if (Array.isArray(importedData.items)) {
          importedData.items.forEach(item => {
            if (item.id && !newItems.some(i => i.id === item.id)) {
              newItems.push(item);
            }
          });
        }

        // 合并分类数据（去重）
        const newCategories = [...new Set([...categories, ...(importedData.categories || [])])];

        // 更新状态
        setItems(newItems);
        setCategories(newCategories);
        if (Array.isArray(importedData.outfitHistory)) {
          setOutfitHistory([...outfitHistory, ...importedData.outfitHistory]);
        }
        if (Array.isArray(importedData.transactions)) {
          setTransactions([...transactions, ...importedData.transactions]);
        }

        setImportStatus("✅ 数据导入成功！");
        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setImportStatus("❌ 导入失败：文件格式错误或数据损坏");
        console.error("导入失败：", error);
      }
    };
    reader.readAsText(file);
  };

  // 切换分类折叠状态
  const toggleCategoryCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // 切换物品卡片折叠状态
  const toggleItemCollapse = (itemId) => {
    setItemCollapsed(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // 删除分类
  const deleteCategory = (catToDelete) => {
    if (window.confirm(`确定删除分类「${catToDelete}」吗？该分类下的物品不会被删除。`)) {
      const newCategories = categories.filter(cat => cat !== catToDelete);
      setCategories(newCategories);
      
      // 如果删除的是当前选中/筛选的分类，自动切换
      if (category === catToDelete) {
        setCategory(recentCategory);
      }
      if (filterCategory === catToDelete) {
        setFilterCategory("全部");
      }
    }
  };

  // 添加自定义分类
  const addCustomCategory = (newCat) => {
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    }
  };

  // 计算物品总成本（含附加成本）
  const getTotalItemCost = (item) => {
    const basePrice = item.price || 0;
    const extraCost = (item.additionalCosts || []).reduce((sum, cost) => sum + (cost.amt || 0), 0);
    return basePrice + extraCost;
  };

  // 计算日成本（长期物品）
  const getDailyCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    
    const buyDate = new Date(item.purchaseDate);
    const today = new Date();
    const days = Math.max(1, Math.floor((today - buyDate) / (1000 * 60 * 60 * 24)));
    return (getTotalItemCost(item) / days).toFixed(2);
  };

  // 计算单次使用成本（消耗品）
  const getUsageCost = (item) => {
    if (item.type !== "consume") return "0.00";
    
    const totalCost = getTotalItemCost(item);
    const usedTimes = Math.max(1, item.usedCount || 0);
    return (totalCost / usedTimes).toFixed(2);
  };

  // 计算剩余数量（消耗品）
  const getRemainingQty = (item) => {
    if (item.type !== "consume" || !item.quantity) return "-";
    const remaining = Math.max(0, item.quantity - (item.usedCount || 0));
    return `${remaining}/${item.quantity}`;
  };

  // ========== 物品操作函数 ==========
  // 重置添加表单
  const resetAddForm = () => {
    setName("");
    setPriceExpr("");
    setPurchaseDate("");
    setExpireDate("");
    setType("long");
    setCategory(recentCategory);
    setCustomCategory("");
    setQuantity("");
    setUsedCount("");
    setAdditionalCosts([]);
    setImage(null);
  };

  // 添加新物品
  const addNewItem = () => {
    // 验证必填项
    if (!name.trim()) {
      alert("请填写物品名称！");
      return;
    }
    
    // 计算价格
    const finalPrice = calculatePrice(priceExpr);
    if (finalPrice === null) {
      alert("请输入有效的价格表达式（支持 + - * /），例如：100+50-20 或 99.9");
      return;
    }

    // 处理分类
    let finalCategory = category;
    if (category === "自定义") {
      finalCategory = customCategory.trim();
      if (!finalCategory) {
        alert("请输入自定义分类名称！");
        return;
      }
      // 添加新分类
      addCustomCategory(finalCategory);
    }

    // 记录最近使用的分类
    setRecentCategory(finalCategory);

    // 构建物品数据
    const newItem = {
      id: Date.now(),
      name: name.trim(),
      price: finalPrice,
      purchaseDate: purchaseDate || "",
      expireDate: expireDate || "",
      type: type,
      category: finalCategory,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      additionalCosts: [...additionalCosts],
      isFinished: false,
      image: image || null
    };

    // 添加到列表
    setItems(prev => [...prev, newItem]);
    // 重置表单
    resetAddForm();
    // 提示成功
    alert(`✅ 物品「${name}」添加成功！`);
  };

  // 复制物品
  const duplicateExistingItem = (item) => {
    const duplicatedItem = {
      ...item,
      id: Date.now(),
      name: `${item.name}（副本）`,
      usedCount: 0, // 重置使用次数
      isFinished: false, // 重置耗尽状态
      purchaseDate: "", // 清空购买日期
      expireDate: "" // 清空到期日期
    };
    setItems(prev => [...prev, duplicatedItem]);
    alert(`✅ 已复制物品「${item.name}」`);
  };

  // 编辑物品（打开弹窗）
  const openEditItemModal = (item) => {
    setCurrentEditItem({ ...item });
    setEditModalVisible(true);
  };

  // 保存编辑后的物品
  const saveEditedItem = () => {
    if (!currentEditItem) return;

    // 验证
    if (!currentEditItem.name.trim()) {
      alert("物品名称不能为空！");
      return;
    }
    if (currentEditItem.price < 0) {
      alert("价格不能为负数！");
      return;
    }

    // 更新物品列表
    setItems(prev => prev.map(item => 
      item.id === currentEditItem.id ? { ...currentEditItem } : item
    ));
    
    // 关闭弹窗
    setEditModalVisible(false);
    alert("✅ 物品修改成功！");
  };

  // 删除物品
  const deleteItem = (itemId) => {
    if (window.confirm("确定删除该物品吗？删除后无法恢复！")) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // 使用一次消耗品
  const useConsumableItem = (itemId) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId && item.type === "consume" && !item.isFinished) {
        return {
          ...item,
          usedCount: (item.usedCount || 0) + 1
        };
      }
      return item;
    }));
  };

  // 标记消耗品为已耗尽
  const markItemAsFinished = (itemId) => {
    if (window.confirm("确定标记该物品为已耗尽吗？")) {
      setItems(prev => prev.map(item => {
        if (item.id === itemId && item.type === "consume") {
          return { ...item, isFinished: true };
        }
        return item;
      }));
    }
  };

  // 添加附加成本
  const addExtraCost = () => {
    const desc = prompt("请输入附加成本名称（如：运费、安装费）：");
    if (!desc || !desc.trim()) return;
    
    const amount = prompt("请输入附加成本金额（元）：");
    if (!amount) return;
    
    const amtNum = Number(amount);
    if (isNaN(amtNum) || amtNum < 0) {
      alert("请输入有效的金额（非负数）！");
      return;
    }

    setAdditionalCosts(prev => [...prev, {
      desc: desc.trim(),
      amt: amtNum
    }]);
  };

  // 删除附加成本
  const removeExtraCost = (index) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  // ========== 筛选逻辑 ==========
  const filteredItemsList = items
    .filter(item => filterCategory === "全部" || item.category === filterCategory)
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  // 按分类分组
  const itemsByCategory = filteredItemsList.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // ========== 渲染页面 ==========
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* 头部区域 */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">物品成本管理系统</h1>
          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              导出数据
            </button>
            <label className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm cursor-pointer">
              导入数据
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
            {importStatus && (
              <span className="text-sm text-gray-700 bg-gray-100 px-2 py-2 rounded-md">
                {importStatus}
              </span>
            )}
          </div>
        </div>

        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-6 font-medium text-sm ${
              activeTab === "items" 
                ? "border-b-2 border-blue-600 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            物品管理
          </button>
          <button
            onClick={() => setActiveTab("outfit")}
            className={`py-2 px-6 font-medium text-sm ${
              activeTab === "outfit" 
                ? "border-b-2 border-pink-600 text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            每日穿搭
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`py-2 px-6 font-medium text-sm ${
              activeTab === "finance" 
                ? "border-b-2 border-green-600 text-green-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            记账管理
          </button>
        </div>
      </header>

      {/* 物品管理标签页 */}
      {activeTab === "items" && (
        <div className="space-y-6">
          {/* 搜索和筛选栏 */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="全部">全部分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 添加物品表单 */}
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">添加新物品</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 物品名称 */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">物品名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：纯棉T恤、无线鼠标、牛奶"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 价格（计算器式输入） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格（支持加减乘除） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={priceExpr}
                  onChange={(e) => setPriceExpr(e.target.value)}
                  placeholder="例如：100+50-20 或 99.9 或 5*20"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {/* 实时计算结果 */}
                {priceExpr && (
                  <div className="mt-1 text-sm">
                    {calculatePrice(priceExpr) !== null ? (
                      <span className="text-green-600">计算结果：¥{calculatePrice(priceExpr).toFixed(2)}</span>
                    ) : (
                      <span className="text-red-500">❌ 表达式无效</span>
                    )}
                  </div>
                )}
              </div>

              {/* 购买日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">购买日期（可选）</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 到期日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  到期日期（可选）
                  <button
                    onClick={() => setExpireDate("")}
                    className="ml-2 text-xs text-red-500 hover:text-red-600"
                  >
                    清空
                  </button>
                </label>
                <input
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 物品类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品类型 <span className="text-red-500">*</span></label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="long">长期物品（如电器、家具）</option>
                  <option value="consume">消耗品（如服饰、食品、日用品）</option>
                </select>
              </div>

              {/* 物品分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品分类 <span className="text-red-500">*</span></label>
                {/* 快捷选择分类 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        category === cat 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(cat);
                        }}
                        className="ml-1 text-xs text-red-500"
                      >
                        ×
                      </button>
                    </button>
                  ))}
                </div>
                {/* 分类选择框 */}
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== "自定义") setCustomCategory("");
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="自定义">自定义分类</option>
                </select>
                {/* 自定义分类输入 */}
                {category === "自定义" && (
                  <input
                    type="text"
                    placeholder="输入自定义分类名称"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                )}
              </div>

              {/* 消耗品专用：总数量 */}
              {type === "consume" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">总数量（可选）</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="例如：10、5、20"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">初始使用次数（可选）</label>
                    <input
                      type="number"
                      min="0"
                      value={usedCount}
                      onChange={(e) => setUsedCount(e.target.value)}
                      placeholder="默认0次"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </>
              )}

              {/* 附加成本 */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">附加成本（如运费、安装费）</label>
                  <button
                    onClick={addExtraCost}
                    className="px-3 py-1 text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                  >
                    添加附加成本
                  </button>
                </div>
                {/* 附加成本列表 */}
                {additionalCosts.length > 0 && (
                  <div className="bg-gray-50 rounded-md p-3">
                    {additionalCosts.map((cost, idx) => (
                      <div key={idx} className="flex justify-between items-center mb-2 last:mb-0">
                        <span className="text-sm text-gray-700">{cost.desc}</span>
                        <span className="text-sm">
                          ¥{cost.amt.toFixed(2)}
                          <button
                            onClick={() => removeExtraCost(idx)}
                            className="ml-2 text-xs text-red-500 hover:text-red-600"
                          >
                            删除
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 添加按钮 */}
            <button
              onClick={addNewItem}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              添加物品
            </button>
          </div>

          {/* 物品列表 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">我的物品列表</h2>
            
            {Object.keys(itemsByCategory).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                暂无物品记录，点击上方「添加新物品」开始记录吧！
              </div>
            ) : (
              Object.keys(itemsByCategory).map(categoryKey => (
                <div key={categoryKey} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* 分类标题栏（可折叠） */}
                  <div
                    onClick={() => toggleCategoryCollapse(categoryKey)}
                    className="px-4 py-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                  >
                    <h3 className="font-medium text-gray-800">{categoryKey}（{itemsByCategory[categoryKey].length}件）</h3>
                    <span className="text-gray-500 text-sm">
                      {collapsed[categoryKey] ? "▼ 展开" : "▲ 收起"}
                    </span>
                  </div>

                  {/* 分类下的物品列表 */}
                  {!collapsed[categoryKey] && (
                    <div className="divide-y divide-gray-100">
                      {itemsByCategory[categoryKey].map(item => (
                        <div key={item.id} className="px-4 py-3">
                          {/* 物品标题栏（可折叠） */}
                          <div
                            onClick={() => toggleItemCollapse(item.id)}
                            className="flex flex-wrap justify-between items-center cursor-pointer"
                          >
                            <div className="flex items-center mb-2 sm:mb-0">
                              <span className="font-medium text-gray-800">{item.name}</span>
                              {item.type === "consume" && item.isFinished && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                  已耗尽
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {item.type === "consume" && item.quantity && (
                                <span>剩余：{getRemainingQty(item)}</span>
                              )}
                              <span>
                                {item.type === "long" ? "日成本" : "次成本"}：
                                ¥{item.type === "long" ? getDailyCost(item) : getUsageCost(item)}
                              </span>
                              <span className="text-gray-500">
                                {itemCollapsed[item.id] ? "▼ 展开" : "▲ 收起"}
                              </span>
                            </div>
                          </div>

                          {/* 物品详情（折叠内容） */}
                          {!itemCollapsed[item.id] && (
                            <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-2">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500">总价：</span>
                                  <span className="font-medium">¥{getTotalItemCost(item).toFixed(2)}</span>
                                </div>
                                {item.purchaseDate && (
                                  <div>
                                    <span className="text-gray-500">购买日期：</span>
                                    <span>{item.purchaseDate}</span>
                                  </div>
                                )}
                                {item.expireDate && (
                                  <div>
                                    <span className="text-gray-500">到期日期：</span>
                                    <span>{item.expireDate}</span>
                                  </div>
                                )}
                                {item.type === "consume" && (
                                  <div>
                                    <span className="text-gray-500">已使用：</span>
                                    <span>{item.usedCount || 0} 次</span>
                                  </div>
                                )}
                              </div>

                              {/* 附加成本 */}
                              {(item.additionalCosts && item.additionalCosts.length > 0) && (
                                <div className="mt-2">
                                  <span className="text-gray-500">附加成本：</span>
                                  <div className="bg-gray-50 rounded-md p-2 mt-1">
                                    {item.additionalCosts.map((cost, idx) => (
                                      <div key={idx} className="text-gray-700">
                                        - {cost.desc}：¥{cost.amt.toFixed(2)}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 操作按钮 */}
                              <div className="flex flex-wrap gap-2 pt-2">
                                {/* 消耗品专用按钮 */}
                                {item.type === "consume" && !item.isFinished && (
                                  <>
                                    <button
                                      onClick={() => useConsumableItem(item.id)}
                                      className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-xs hover:bg-green-200 transition-colors"
                                    >
                                      使用一次 (+1)
                                    </button>
                                    <button
                                      onClick={() => markItemAsFinished(item.id)}
                                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200 transition-colors"
                                    >
                                      标记为耗尽
                                    </button>
                                  </>
                                )}

                                {/* 通用按钮 */}
                                <button
                                  onClick={() => duplicateExistingItem(item)}
                                  className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs hover:bg-yellow-200 transition-colors"
                                >
                                  复制物品
                                </button>
                                <button
                                  onClick={() => openEditItemModal(item)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-xs hover:bg-blue-200 transition-colors"
                                >
                                  编辑
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="px-3 py-1 bg-gray-100 text-red-700 rounded-md text-xs hover:bg-gray-200 transition-colors ml-auto"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 每日穿搭标签页（简化版） */}
      {activeTab === "outfit" && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">每日穿搭功能</h2>
          <p>该功能需结合「服饰」分类的消耗品使用，如需启用请联系开发人员完善。</p>
        </div>
      )}

      {/* 记账管理标签页（简化版） */}
      {activeTab === "finance" && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">记账管理功能</h2>
          <p>如需启用完整记账功能，请联系开发人员完善。</p>
        </div>
      )}

      {/* 编辑物品弹窗 */}
      {editModalVisible && currentEditItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">编辑物品</h3>
              <button
                onClick={() => setEditModalVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* 物品名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={currentEditItem.name || ""}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 价格 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格（元） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentEditItem.price || ""}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 购买日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">购买日期（可选）</label>
                <input
                  type="date"
                  value={currentEditItem.purchaseDate || ""}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, purchaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 到期日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  到期日期（可选）
                  <button
                    onClick={() => setCurrentEditItem({ ...currentEditItem, expireDate: "" })}
                    className="ml-2 text-xs text-red-500 hover:text-red-600"
                  >
                    清空
                  </button>
                </label>
                <input
                  type="date"
                  value={currentEditItem.expireDate || ""}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, expireDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 物品类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品类型</label>
                <select
                  value={currentEditItem.type || "long"}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="long">长期物品</option>
                  <option value="consume">消耗品</option>
                </select>
              </div>

              {/* 分类 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物品分类</label>
                <input
                  type="text"
                  value={currentEditItem.category || ""}
                  onChange={(e) => setCurrentEditItem({ ...currentEditItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 消耗品专用 */}
              {currentEditItem.type === "consume" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">总数量</label>
                    <input
                      type="number"
                      min="1"
                      value={currentEditItem.quantity || ""}
                      onChange={(e) => setCurrentEditItem({ ...currentEditItem, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">已使用次数</label>
                    <input
                      type="number"
                      min="0"
                      value={currentEditItem.usedCount || 0}
                      onChange={(e) => setCurrentEditItem({ ...currentEditItem, usedCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <div className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        id="finished-status"
                        checked={currentEditItem.isFinished || false}
                        onChange={(e) => setCurrentEditItem({ ...currentEditItem, isFinished: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="finished-status" className="text-sm text-gray-700">标记为已耗尽</label>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* 弹窗底部按钮 */}
            <div className="px-5 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditModalVisible(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveEditedItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}