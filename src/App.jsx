import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

// ========== 版本配置（修改这里即可触发更新提醒） ==========
const CURRENT_VERSION = "1.2.0"; // 每次更新改这个版本号（比如 1.1.0 → 1.2.0）
const VERSION_STORAGE_KEY = "MY_APP_VERSION";

export default function App() {
  // ========== 核心状态（增加异常捕获，确保数据不丢失） ==========
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_LIFE_COST_ITEMS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取物品数据失败，使用空列表", e);
      return [];
    }
  });

  const [outfitHistory, setOutfitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_OUTFIT_HISTORY");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取穿搭数据失败，使用空列表", e);
      return [];
    }
  });

  // ========== 版本检查状态 ==========
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [oldVersion, setOldVersion] = useState("");

  // ========== 表单状态 ==========
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

  // ========== 辅助状态 ==========
  const [activeTab, setActiveTab] = useState("items");
  const [editingId, setEditingId] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({});
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);

  // ========== 本地存储 ==========
  useEffect(() => {
    localStorage.setItem("MY_LIFE_COST_ITEMS", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("MY_OUTFIT_HISTORY", JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  // ========== 版本检查核心逻辑 ==========
  useEffect(() => {
    // 1. 获取本地保存的版本号
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY) || "1.0.0";
    
    // 2. 对比版本号（简单的字符串对比，满足你的需求）
    if (savedVersion !== CURRENT_VERSION) {
      setOldVersion(savedVersion);
      setShowUpdateAlert(true);
      // 3. 更新本地版本号（只提醒一次）
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    }
  }, []);

  // ========== 工具函数 ==========
  const allCategories = ["服饰", "电子产品", "食品", "日用品", "其他", ...Array.from(new Set(items.map(i => i.category)))];

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

  // ========== OCR识别功能 ==========
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    performOCR(file);
  };

  const preprocessImage = (file) =>
    new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          const avg = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
          imageData.data[i] = imageData.data[i + 1] = imageData.data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => resolve(blob), "image/png");
      };
    });

  const performOCR = async (file) => {
    setOcrLoading(true);
    const preprocessedFile = await preprocessImage(file);
    Tesseract.recognize(preprocessedFile, "chi_sim+eng", {
      tessedit_char_whitelist: "0123456789.-年月日实付款总计金额合计",
      preserve_interword_spaces: "1",
    })
      .then(({ data: { text } }) => {
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        let detectedName = "", detectedPrice = "", detectedDate = "";

        const priceRegex = /(\d+(\.\d{1,2})?)/;
        const priceLines = lines.filter(l => l.includes("实付款") || l.includes("总计") || l.includes("金额"));
        if (priceLines.length > 0) {
          const priceMatch = priceLines[0].match(priceRegex);
          if (priceMatch) detectedPrice = priceMatch[0];
          const priceLineIndex = lines.indexOf(priceLines[0]);
          if (priceLineIndex > 0) detectedName = lines[priceLineIndex - 1];
        } else {
          for (const line of lines) {
            const match = line.match(priceRegex);
            if (match) {
              detectedPrice = match[0];
              break;
            }
          }
        }

        const dateRegex = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/;
        for (const line of lines) {
          const dateMatch = line.match(dateRegex);
          if (dateMatch) {
            detectedDate = dateMatch[0];
            if (detectedDate.includes("/")) {
              const [mm, dd, yyyy] = detectedDate.split("/");
              detectedDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
            }
            break;
          }
        }

        if (detectedName) setName(detectedName);
        if (detectedPrice) setPrice(detectedPrice);
        if (detectedDate) setPurchaseDate(detectedDate);
      })
      .finally(() => setOcrLoading(false));
  };

  // ========== 物品操作功能 ==========
  const resetForm = () => {
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

  const addOrUpdateItem = () => {
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
      name,
      price: Number(price),
      purchaseDate,
      expireDate: expireDate || "",
      type,
      category: finalCategory,
      image: image || undefined,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      additionalCosts: [...additionalCosts],
      isFinished: false,
      inTrash: false
    };

    if (editingId) {
      setItems(items.map(item => item.id === editingId ? { ...item, ...itemData } : item));
    } else {
      setItems([...items, { id: Date.now(), ...itemData }]);
    }
    resetForm();
  };

  const startEdit = (item) => {
    setName(item.name);
    setPrice(String(item.price));
    setPurchaseDate(item.purchaseDate);
    setExpireDate(item.expireDate || "");
    setType(item.type);
    if (allCategories.includes(item.category)) {
      setCategory(item.category);
      setCustomCategory("");
    } else {
      setCategory("自定义");
      setCustomCategory(item.category);
    }
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUsedCount(item.usedCount != null ? String(item.usedCount) : "");
    setAdditionalCosts(item.additionalCosts || []);
    setImage(item.image);
    setEditingId(item.id);
  };

  const addAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述（如：运费、安装费）：");
    const amt = prompt("请输入附加成本金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("描述不能为空，金额必须是数字！");
      return;
    }
    setAdditionalCosts(prev => [...prev, { desc, amt: Number(amt) }]);
  };

  const removeAdditionalCost = (index) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = () => {
    if (window.confirm("确定删除这张图片吗？")) {
      setImage(null);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* 版本更新提醒弹窗 */}
      {showUpdateAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">🎉 版本更新</h3>
              <p className="mt-1 text-sm">
                已从 v{oldVersion} 更新到 v{CURRENT_VERSION}
              </p>
              <p className="mt-2 text-xs opacity-90">
                ✅ 自定义分类可正常输入<br/>
                ✅ 数据永久保存不丢失<br/>
                ✅ 版本更新自动提醒
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

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">米米去处 · 物品与穿搭管理</h1>
        <div className="flex border-b border-gray-200 mt-4">
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "items" 
                ? "border-b-2 border-blue-600 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            物品管理
          </button>
          <button
            onClick={() => setActiveTab("outfit")}
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === "outfit" 
                ? "border-b-2 border-pink-600 text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            每日穿搭
          </button>
        </div>
        {/* 显示当前版本号（可选） */}
        <p className="mt-2 text-xs text-gray-500">当前版本：v{CURRENT_VERSION}</p>
      </header>

      {activeTab === "items" && (
        <>
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

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-100">
              {editingId ? "编辑物品" : "添加新物品"}
            </h2>

            {editingId && (
              <button
                onClick={resetForm}
                className="w-full mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消编辑
              </button>
            )}

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
              <label className="block text-sm font-medium text-gray-600 mb-2">凭证图片（可选，支持OCR识别）</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
              />

              {ocrLoading && (
                <p className="text-sm text-blue-500 mt-2">正在识别图片信息，请稍候...</p>
              )}

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
              onClick={addOrUpdateItem}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              {editingId ? "保存修改" : "添加物品"}
            </button>
          </div>

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
                                onClick={() => startEdit(item)}
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

      {activeTab === "outfit" && (
        <div className="space-y-6 mb-10">
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
    </div>
  );
}