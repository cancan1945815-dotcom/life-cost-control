import React, { useState, useEffect } from "react";

// ========== 版本配置 ==========
const CURRENT_VERSION = "3.0.0";
const VERSION_STORAGE_KEY = "MY_APP_VERSION";

export default function App() {
  // ========== 核心状态 ==========
  // 物品数据
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_LIFE_COST_ITEMS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取物品数据失败，使用空列表", e);
      return [];
    }
  });

  // 穿搭记录
  const [outfitHistory, setOutfitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_OUTFIT_HISTORY");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取穿搭数据失败，使用空列表", e);
      return [];
    }
  });

  // 记账数据
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_TRANSACTIONS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取记账数据失败，使用空列表", e);
      return [];
    }
  });

  // ========== 表单状态 ==========
  // 物品添加表单
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState("服饰");
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
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({}); // 默认全部折叠
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [oldVersion, setOldVersion] = useState("");

  // ========== 本地存储 ==========
  useEffect(() => {
    localStorage.setItem("MY_LIFE_COST_ITEMS", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("MY_OUTFIT_HISTORY", JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  useEffect(() => {
    localStorage.setItem("MY_TRANSACTIONS", JSON.stringify(transactions));
  }, [transactions]);

  // ========== 版本检查 ==========
  useEffect(() => {
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY) || "1.0.0";
    if (savedVersion !== CURRENT_VERSION) {
      setOldVersion(savedVersion);
      setShowUpdateAlert(true);
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    }

    // 初始化所有分类为折叠状态
    const allCats = ["服饰", "电子产品", "食品", "日用品", "其他", ...Array.from(new Set(items.map(i => i.category)))];
    const initialCollapsed = {};
    allCats.forEach(cat => {
      initialCollapsed[cat] = true; // 默认折叠
    });
    setCollapsed(initialCollapsed);
  }, []);

  // ========== 工具函数 ==========
  const allCategories = ["服饰", "电子产品", "食品", "日用品", "其他", ...Array.from(new Set(items.map(i => i.category)))];
  
  // 记账分类
  const transCategories = {
    expense: ["日常消费", "餐饮", "购物", "交通", "娱乐", "房租", "水电费", "其他支出"],
    income: ["工资", "兼职", "理财", "红包", "其他收入"]
  };

  const toggleCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getTotalCost = (item) => {
    const basePrice = item.price || 0;
    const extraCost = (item.additionalCosts || []).reduce((sum, curr) => sum + (curr.amt || 0), 0);
    return basePrice + extraCost;
  };

  const getDayCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    const buyDate = new Date(item.purchaseDate);
    const today = new Date();
    const days = Math.max(1, Math.floor((today - buyDate) / (1000 * 60 * 60 * 24)));
    return (getTotalCost(item) / days).toFixed(2);
  };

  const getUseCost = (item) => {
    if (item.type !== "consume") return "0.00";
    const total = getTotalCost(item);
    const count = Math.max(1, item.usedCount || 0);
    return (total / count).toFixed(2);
  };

  // 记账统计
  const getFinanceStats = () => {
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

  // 导出数据
  const exportData = () => {
    const data = {
      items,
      outfitHistory,
      transactions,
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `物品穿搭记账数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ========== 物品操作功能 ==========
  // 重置添加表单
  const resetAddForm = () => {
    setName("");
    setPrice("");
    setPurchaseDate("");
    setExpireDate("");
    setType("long");
    setCategory("服饰");
    setCustomCategory("");
    setQuantity("");
    setUsedCount("");
    setAdditionalCosts([]);
    setImage(null);
    setEditingId(null);
  };

  // 添加物品
  const addItem = () => {
    if (!name || !price || !purchaseDate) {
      alert("请填写名称、价格和购买日期（必填项）");
      return;
    }

    const finalCategory = category === "自定义" ? customCategory.trim() : category;
    if (category === "自定义" && !finalCategory) {
      alert("请输入自定义分类名称");
      return;
    }

    const itemData = {
      id: Date.now(),
      name,
      price: Number(price),
      purchaseDate,
      expireDate: expireDate || "",
      type,
      category: finalCategory,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      additionalCosts: [...additionalCosts],
      isFinished: false,
      inTrash: false,
      image: image || null
    };

    setItems([...items, itemData]);
    resetAddForm();
    
    // 更新折叠状态
    setCollapsed(prev => ({ ...prev, [finalCategory]: true }));
  };

  // 打开编辑弹窗
  const openEditModal = (item) => {
    setCurrentEditItem({ ...item });
    setEditModalVisible(true);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!currentEditItem?.name || !currentEditItem?.price || !currentEditItem?.purchaseDate) {
      alert("请填写名称、价格和购买日期（必填项）");
      return;
    }

    setItems(items.map(item => 
      item.id === currentEditItem.id ? { ...currentEditItem } : item
    ));
    setEditModalVisible(false);
  };

  // 添加附加成本
  const addAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述（如：运费、安装费）：");
    const amt = prompt("请输入附加成本金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("描述不能为空，金额必须是数字！");
      return;
    }
    setAdditionalCosts(prev => [...prev, { desc, amt: Number(amt) }]);
  };

  // 编辑物品的附加成本
  const addEditAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述（如：运费、安装费）：");
    const amt = prompt("请输入附加成本金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("描述不能为空，金额必须是数字！");
      return;
    }
    setCurrentEditItem(prev => ({
      ...prev,
      additionalCosts: [...(prev.additionalCosts || []), { desc, amt: Number(amt) }]
    }));
  };

  const removeAdditionalCost = (index) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditAdditionalCost = (index) => {
    setCurrentEditItem(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index)
    }));
  };

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCurrentEditItem(prev => ({ ...prev, image: url }));
  };

  const removeImage = () => {
    if (window.confirm("确定删除这张图片吗？")) {
      setImage(null);
    }
  };

  const removeEditImage = () => {
    if (window.confirm("确定删除这张图片吗？")) {
      setCurrentEditItem(prev => ({ ...prev, image: null }));
    }
  };

  // ========== 消耗品专属功能 ==========
  const handleUseOnce = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        if (item.type !== "consume") return item;
        if (item.isFinished) {
          alert("该物品已标记为耗尽，无法再使用！");
          return item;
        }
        return { ...item, usedCount: (item.usedCount || 0) + 1 };
      }
      return item;
    }));
  };

  const handleMarkFinished = (itemId) => {
    if (window.confirm("确定标记该物品为已耗尽吗？标记后将无法再增加使用次数！")) {
      setItems(items.map(item => {
        if (item.id === itemId && item.type === "consume") {
          return { ...item, isFinished: true };
        }
        return item;
      }));
    }
  };

  // ========== 每日穿搭专属功能 ==========
  const outfitAvailableItems = items.filter(item => 
    item.category === "服饰" && 
    item.type === "consume" && 
    !item.isFinished &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOutfitItem = (itemId) => {
    setSelectedOutfitItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const saveTodayOutfit = () => {
    if (selectedOutfitItems.length === 0) {
      alert("请至少选择一件服饰");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    
    const updatedItems = items.map(item => {
      if (selectedOutfitItems.includes(item.id) && !item.isFinished) {
        return { ...item, usedCount: (item.usedCount || 0) + 1 };
      }
      return item;
    });
    setItems(updatedItems);

    const newRecord = {
      date: today,
      itemIds: selectedOutfitItems,
      note: ""
    };

    const existingIndex = outfitHistory.findIndex(r => r.date === today);
    let newHistory;
    if (existingIndex >= 0) {
      newHistory = outfitHistory.map((r, i) => i === existingIndex ? newRecord : r);
    } else {
      newHistory = [...outfitHistory, newRecord].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setOutfitHistory(newHistory);
    setSelectedOutfitItems([]);
    alert("今日穿搭已保存，使用次数已更新！");
  };

  const deleteOutfitRecord = (date) => {
    if (window.confirm("确定删除该条穿搭记录吗？")) {
      setOutfitHistory(outfitHistory.filter(r => r.date !== date));
    }
  };

  // ========== 记账功能 ==========
  const addTransaction = () => {
    if (!transAmount || isNaN(Number(transAmount)) || Number(transAmount) <= 0) {
      alert("请输入有效的金额");
      return;
    }

    const newTrans = {
      id: Date.now(),
      type: transType,
      amount: Number(transAmount),
      category: transCategory,
      date: transDate,
      note: transNote
    };

    setTransactions([...transactions, newTrans]);
    
    // 重置表单
    setTransAmount("");
    setTransNote("");
    setTransDate(new Date().toISOString().split("T")[0]);
  };

  const deleteTransaction = (id) => {
    if (window.confirm("确定删除该条记账记录吗？")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // ========== 筛选逻辑 ==========
  const filteredItems = items
    .filter(item => !item.inTrash)
    .filter(item => filterCategory === "全部" || item.category === filterCategory)
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // 筛选记账记录
  const filteredTransactions = transactions
    .filter(t => t.note.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* 版本更新提醒 */}
      {showUpdateAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">🎉 版本更新</h3>
              <p className="mt-1 text-sm">已从 v{oldVersion} 更新到 v{CURRENT_VERSION}</p>
              <p className="mt-2 text-xs opacity-90">
                ✅ 独立编辑弹窗 ✅ 默认折叠分类 ✅ 新增记账功能<br/>
                ✅ 数据统计 ✅ 导出功能 ✅ 细节优化
              </p>
            </div>
            <button 
              onClick={() => setShowUpdateAlert(false)}
              className="text-white hover:text-gray-200 ml-2"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">米米去处 · 全能管理</h1>
          <button 
            onClick={exportData}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            导出数据
          </button>
        </div>
        
        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200 mt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === "items" 
                ? "border-b-2 border-blue-600 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            物品管理
          </button>
          <button
            onClick={() => setActiveTab("outfit")}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === "outfit" 
                ? "border-b-2 border-pink-600 text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            每日穿搭
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === "finance" 
                ? "border-b-2 border-green-600 text-green-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            记账管理
          </button>
        </div>
        
        <p className="mt-2 text-xs text-gray-500">v{CURRENT_VERSION} | 数据仅保存在本地，安全无忧</p>
      </header>

      {/* ========== 物品管理标签页 ========== */}
      {activeTab === "items" && (
        <>
          {/* 搜索与筛选栏 */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-6 flex flex-col sm:flex-row gap-3">
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
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 物品添加表单 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-100">
              添加新物品
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">物品名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：纯棉T恤、无线鼠标"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">价格（元） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">购买日期 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">到期日期（可选）</label>
                <input
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">物品类型 <span className="text-red-500">*</span></label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="long">长期物品（如电器、家具）</option>
                  <option value="consume">消耗品（如服饰、食品、日用品）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">物品分类 <span className="text-red-500">*</span></label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== "自定义") setCustomCategory("");
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="自定义">自定义分类</option>
                </select>
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

              {type === "consume" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">总数量（可选）</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="如：10片、5件"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">初始使用次数（可选）</label>
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
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-600">附加成本（如运费、安装费）</label>
                <button
                  onClick={addAdditionalCost}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  添加
                </button>
              </div>

              {additionalCosts.length > 0 && (
                <div className="bg-gray-50 rounded-md p-3 mt-2">
                  {additionalCosts.map((cost, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                      <span className="text-sm text-gray-700">{cost.desc}：{cost.amt.toFixed(2)}元</span>
                      <button
                        onClick={() => removeAdditionalCost(index)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">凭证图片（可选）</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
              />

              {image && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={image}
                    alt="物品凭证"
                    className="w-20 h-20 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    onClick={removeImage}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    删除图片
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={addItem}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              添加物品
            </button>
          </div>

          {/* 物品列表 */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">我的物品列表</h2>

            {Object.keys(groupedItems).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">暂无符合条件的物品记录</p>
                <p className="text-gray-400 mt-2">点击上方「添加新物品」开始记录吧！</p>
              </div>
            ) : (
              Object.keys(groupedItems).map(category => (
                <div key={category} className="mb-5">
                  <div
                    onClick={() => toggleCollapse(category)}
                    className="bg-gray-100 rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <span className="font-medium text-gray-800">{category}（{groupedItems[category].length}件）</span>
                    <span className="text-gray-500">{collapsed[category] ? "▲ 收起" : "▼ 展开"}</span>
                  </div>

                  {!collapsed[category] && (
                    <div className="mt-3 space-y-3">
                      {groupedItems[category].map(item => (
                        <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                          <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                            {item.image && (
                              <div className="sm:w-24 sm:h-24 flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-md border border-gray-200"
                                />
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                                {item.type === "consume" && (
                                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    item.isFinished
                                      ? "bg-red-100 text-red-800"
                                      : "bg-green-100 text-green-800"
                                  }`}>
                                    {item.isFinished ? "已耗尽" : "使用中"}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
                                <p className="text-gray-600">
                                  <span className="font-medium text-gray-700">总价：</span>
                                  ¥{getTotalCost(item).toFixed(2)}（含附加）
                                </p>
                                <p className="text-gray-600">
                                  <span className="font-medium text-gray-700">购买日期：</span>
                                  {item.purchaseDate}
                                </p>
                                {item.expireDate && (
                                  <p className="text-gray-600">
                                    <span className="font-medium text-gray-700">到期日期：</span>
                                    {item.expireDate}
                                  </p>
                                )}
                                {item.type === "consume" && item.quantity && (
                                  <p className="text-gray-600">
                                    <span className="font-medium text-gray-700">总数量：</span>
                                    {item.quantity}
                                  </p>
                                )}
                              </div>

                              <div className="mb-4">
                                {item.type === "long" ? (
                                  <div className="bg-blue-50 rounded-md p-3">
                                    <p className="font-medium text-blue-800">长期物品 · 每日成本</p>
                                    <p className="text-2xl font-bold text-blue-600 mt-1">¥{getDayCost(item)}</p>
                                    <p className="text-xs text-gray-500 mt-1">随使用天数增加，成本逐渐降低</p>
                                  </div>
                                ) : (
                                  <div className="bg-green-50 rounded-md p-3">
                                    <p className="font-medium text-green-800">消耗品 · 单次成本</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">¥{getUseCost(item)}</p>
                                    <p className="text-xs text-gray-500 mt-1">已使用 {item.usedCount || 0} 次</p>
                                  </div>
                                )}
                              </div>

                              {item.additionalCosts && item.additionalCosts.length > 0 && (
                                <div className="mb-4 text-sm">
                                  <details>
                                    <summary className="font-medium text-gray-700 cursor-pointer">查看附加成本</summary>
                                    <div className="mt-2 bg-gray-50 rounded-md p-2">
                                      {item.additionalCosts.map((cost, idx) => (
                                        <p key={idx} className="text-gray-600">- {cost.desc}：¥{cost.amt.toFixed(2)}</p>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-gray-50 px-4 py-3 flex flex-wrap gap-2 border-t border-gray-100">
                            {item.type === "consume" && !item.isFinished && (
                              <>
                                <button
                                  onClick={() => handleUseOnce(item.id)}
                                  className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                                >
                                  使用一次（+1）
                                </button>
                                <button
                                  onClick={() => handleMarkFinished(item.id)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                >
                                  标记为耗尽
                                </button>
                              </>
                            )}

                            <div className="ml-auto flex gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("确定删除该物品吗？删除后无法恢复！")) {
                                    setItems(items.filter(i => i.id !== item.id));
                                  }
                                }}
                                className="px-3 py-1.5 bg-gray-200 text-red-600 rounded-md text-sm hover:bg-gray-300 transition-colors"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ========== 每日穿搭标签页 ========== */}
      {activeTab === "outfit" && (
        <div className="space-y-6 mb-10">
          {/* 今日穿搭选择区 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">今日穿搭 ({new Date().toISOString().split("T")[0]})</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜索服饰..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              <p className="text-xs text-gray-500 mt-2">提示：仅显示「服饰」分类且「未耗尽」的消耗品</p>
            </div>

            {outfitAvailableItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无可用服饰，请先在「物品管理」中添加分类为「服饰」的消耗品。
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                  {outfitAvailableItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleOutfitItem(item.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedOutfitItems.includes(item.id)
                          ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {item.image && (
                        <div className="w-full h-20 mb-2 overflow-hidden rounded">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h3 className="font-medium text-sm text-center">{item.name}</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">¥{getUseCost(item)}/次</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveTodayOutfit}
                  className="w-full py-3 bg-pink-600 text-white rounded-md font-medium hover:bg-pink-700 transition-colors"
                >
                  保存今日穿搭记录
                </button>
              </>
            )}
          </div>

          {/* 历史穿搭记录 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">历史穿搭记录</h2>
            
            {outfitHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无历史穿搭记录
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {outfitHistory.map(record => {
                  const recordItems = items.filter(item => record.itemIds.includes(item.id));
                  return (
                    <div key={record.date} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">{record.date}</h3>
                        <button
                          onClick={() => deleteOutfitRecord(record.date)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recordItems.map(item => (
                          <span key={item.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 记账管理标签页 ========== */}
      {activeTab === "finance" && (
        <div className="space-y-6 mb-10">
          {/* 财务统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
              <h3 className="text-sm text-gray-500 mb-1">总支出</h3>
              <p className="text-2xl font-bold text-red-600">¥{getFinanceStats().totalExpense}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <h3 className="text-sm text-gray-500 mb-1">总收入</h3>
              <p className="text-2xl font-bold text-green-600">¥{getFinanceStats().totalIncome}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <h3 className="text-sm text-gray-500 mb-1">账户余额</h3>
              <p className={`text-2xl font-bold ${getFinanceStats().balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ¥{getFinanceStats().balance}
              </p>
            </div>
          </div>

          {/* 添加记账记录 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-600 mb-4 border-b pb-2 border-gray-100">
              添加记账记录
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">交易类型 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransType("expense")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      transType === "expense" 
                        ? "bg-red-100 text-red-700 border-red-200" 
                        : "bg-white text-gray-700 border-gray-200"
                    } border`}
                  >
                    支出
                  </button>
                  <button
                    onClick={() => setTransType("income")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      transType === "income" 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-white text-gray-700 border-gray-200"
                    } border`}
                  >
                    收入
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">金额（元） <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transAmount}
                  onChange={(e) => setTransAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">分类 <span className="text-red-500">*</span></label>
                <select
                  value={transCategory}
                  onChange={(e) => setTransCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                >
                  {transCategories[transType].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">日期 <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={transDate}
                  onChange={(e) => setTransDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">备注（可选）</label>
                <textarea
                  value={transNote}
                  onChange={(e) => setTransNote(e.target.value)}
                  placeholder="输入备注信息..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                ></textarea>
              </div>
            </div>

            <button
              onClick={addTransaction}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              添加记账记录
            </button>
          </div>

          {/* 记账记录列表 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-600">记账记录</h2>
              <input
                type="text"
                placeholder="搜索备注/分类..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
              />
            </div>
            
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无记账记录
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {filteredTransactions.map(trans => (
                  <div key={trans.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium mr-2 ${
                          trans.type === "expense" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {trans.type === "expense" ? "支出" : "收入"}
                        </span>
                        <span className="font-medium">{trans.category}</span>
                      </div>
                      <span className={`font-bold ${
                        trans.type === "expense" ? "text-red-600" : "text-green-600"
                      }`}>
                        {trans.type === "expense" ? "-" : "+"}¥{trans.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                      <div>
                        <span>{trans.date}</span>
                        {trans.note && (
                          <span className="ml-2">| {trans.note}</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTransaction(trans.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 编辑物品弹窗 ========== */}
      {editModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">编辑物品</h3>
              <button
                onClick={() => setEditModalVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="p-4">
              {currentEditItem && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">物品名称 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={currentEditItem.name || ""}
                      onChange={(e) => setCurrentEditItem(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">价格（元） <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentEditItem.price || ""}
                      onChange={(e) => setCurrentEditItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">购买日期 <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      value={currentEditItem.purchaseDate || ""}
                      onChange={(e) => setCurrentEditItem(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">到期日期（可选）</label>
                    <input
                      type="date"
                      value={currentEditItem.expireDate || ""}
                      onChange={(e) => setCurrentEditItem(prev => ({ ...prev, expireDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">物品类型 <span className="text-red-500">*</span></label>
                    <select
                      value={currentEditItem.type || "long"}
                      onChange={(e) => setCurrentEditItem(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                    >
                      <option value="long">长期物品（如电器、家具）</option>
                      <option value="consume">消耗品（如服饰、食品、日用品）</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">物品分类 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={currentEditItem.category || ""}
                      onChange={(e) => setCurrentEditItem(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  {currentEditItem.type === "consume" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">总数量（可选）</label>
                        <input
                          type="number"
                          value={currentEditItem.quantity || ""}
                          onChange={(e) => setCurrentEditItem(prev => ({ ...prev, quantity: e.target.value ? Number(e.target.value) : null }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">已使用次数</label>
                        <input
                          type="number"
                          min="0"
                          value={currentEditItem.usedCount || 0}
                          onChange={(e) => setCurrentEditItem(prev => ({ ...prev, usedCount: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-600">附加成本（如运费、安装费）</label>
                      <button
                        onClick={addEditAdditionalCost}
                        className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                      >
                        添加
                      </button>
                    </div>

                    {(currentEditItem.additionalCosts || []).length > 0 && (
                      <div className="bg-gray-50 rounded-md p-3 mt-2">
                        {(currentEditItem.additionalCosts || []).map((cost, index) => (
                          <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                            <span className="text-sm text-gray-700">{cost.desc}：{cost.amt.toFixed(2)}元</span>
                            <button
                              onClick={() => removeEditAdditionalCost(index)}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              删除
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-2">凭证图片（可选）</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="w-full"
                    />

                    {currentEditItem.image && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={currentEditItem.image}
                          alt="物品凭证"
                          className="w-20 h-20 object-cover rounded-md border border-gray-200"
                        />
                        <button
                          onClick={removeEditImage}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          删除图片
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">状态</label>
                    {currentEditItem.type === "consume" && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="checkbox"
                          id="finished"
                          checked={currentEditItem.isFinished || false}
                          onChange={(e) => setCurrentEditItem(prev => ({ ...prev, isFinished: e.target.checked }))}
                        />
                        <label htmlFor="finished" className="text-sm">标记为已耗尽</label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                onClick={() => setEditModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
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