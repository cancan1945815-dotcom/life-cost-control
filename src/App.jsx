import React, { useState, useEffect, useRef } from "react";
import ItemForm from "./components/ItemForm";
import ItemCard from "./components/ItemCard";
import TransactionForm from "./components/TransactionForm";
import { 
  CURRENT_VERSION, 
  VERSION_STORAGE_KEY, 
  REMOTE_VERSION_URL,
  STORAGE_KEYS,
  DEFAULT_CATEGORIES
} from "./constants";
import { 
  safeParseStorage, 
  getFinanceStats 
} from "./utils";

export default function App() {
  // ========== 核心状态 ==========
  const [items, setItems] = useState(() => 
    safeParseStorage(STORAGE_KEYS.ITEMS, [])
  );

  const [outfitHistory, setOutfitHistory] = useState(() => 
    safeParseStorage(STORAGE_KEYS.OUTFIT_HISTORY, [])
  );

  const [transactions, setTransactions] = useState(() => 
    safeParseStorage(STORAGE_KEYS.TRANSACTIONS, [])
  );

  const [categories, setCategories] = useState(() => 
    safeParseStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES)
  );

  const [recentCategory, setRecentCategory] = useState(() => 
    localStorage.getItem(STORAGE_KEYS.RECENT_CATEGORY) || "服饰"
  );

  // ========== 辅助状态 ==========
  const [activeTab, setActiveTab] = useState("items");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({});
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  
  // 文件导入ref
  const fileInputRef = useRef(null);

  // ========== 本地存储 ==========
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OUTFIT_HISTORY, JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECENT_CATEGORY, recentCategory);
  }, [recentCategory]);

  // ========== 初始化 ==========
  useEffect(() => {
    // 初始化分类折叠状态
    const initialCollapsed = {};
    categories.forEach(cat => {
      initialCollapsed[cat] = true;
    });
    setCollapsed(initialCollapsed);

    // 检查版本更新
    checkVersionUpdate();

    // 检查本地版本
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY) || "1.0.0";
    if (savedVersion !== CURRENT_VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    }
  }, [categories]);

  // ========== 版本更新检查 ==========
  const checkVersionUpdate = async () => {
    try {
      // 本地版本模拟
      const latestVersion = "4.0.0";
      
      if (latestVersion !== CURRENT_VERSION) {
        setUpdateAvailable(true);
        setNewVersion(latestVersion);
      }
    } catch (e) {
      console.log("检查版本更新失败", e);
    }
  };

  const performUpdate = () => {
    localStorage.removeItem(VERSION_STORAGE_KEY);
    window.location.reload();
    setShowUpdateAlert(true);
    setUpdateAvailable(false);
  };

  // ========== 数据导入导出 ==========
  const exportData = () => {
    const data = {
      items,
      outfitHistory,
      transactions,
      categories,
      exportTime: new Date().toISOString(),
      version: CURRENT_VERSION
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `物品穿搭记账数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      readImportFile(file);
    }
  };

  const readImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (!importedData || typeof importedData !== "object") {
          setImportStatus("错误：无效的文件格式");
          return;
        }

        // 合并数据
        const mergedItems = [...items];
        const mergedOutfits = [...outfitHistory];
        const mergedTransactions = [...transactions];
        const mergedCategories = [...new Set([...categories, ...(importedData.categories || [])])];

        // 添加新物品
        if (Array.isArray(importedData.items)) {
          importedData.items.forEach(item => {
            if (item.id && !mergedItems.some(i => i.id === item.id)) {
              mergedItems.push(item);
            }
          });
        }

        // 添加新穿搭记录
        if (Array.isArray(importedData.outfitHistory)) {
          importedData.outfitHistory.forEach(outfit => {
            if (outfit.date && !mergedOutfits.some(o => o.date === outfit.date)) {
              mergedOutfits.push(outfit);
            }
          });
        }

        // 添加新记账记录
        if (Array.isArray(importedData.transactions)) {
          importedData.transactions.forEach(trans => {
            if (trans.id && !mergedTransactions.some(t => t.id === trans.id)) {
              mergedTransactions.push(trans);
            }
          });
        }

        // 更新状态
        setItems(mergedItems);
        setOutfitHistory(mergedOutfits);
        setTransactions(mergedTransactions);
        setCategories(mergedCategories);

        setImportStatus(`成功：导入 ${importedData.items?.length || 0} 个物品，${importedData.outfitHistory?.length || 0} 条穿搭记录，${importedData.transactions?.length || 0} 条记账记录`);
        
        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setImportStatus(`错误：${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // ========== 工具函数 ==========
  const toggleCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const deleteCategory = (catToDelete) => {
    if (window.confirm(`确定删除分类"${catToDelete}"吗？该分类下的物品不会被删除。`)) {
      const newCategories = categories.filter(cat => cat !== catToDelete);
      setCategories(newCategories);
      
      if (filterCategory === catToDelete) {
        setFilterCategory("全部");
      }
    }
  };

  const addCustomCategory = (newCat) => {
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    }
  };

  // ========== 物品操作 ==========
  const handleAddItem = (itemData, finalCategory) => {
    // 记忆本次选择的分类
    setRecentCategory(finalCategory);
    
    // 添加新物品
    setItems([...items, itemData]);
    
    // 新分类默认折叠
    setCollapsed(prev => ({ ...prev, [finalCategory]: true }));
    
    // 添加新分类
    addCustomCategory(finalCategory);
  };

  const handleEditItem = (updatedItem, finalCategory) => {
    setItems(items.map(item => 
      item.id === updatedItem.id ? { ...updatedItem } : item
    ));
    setEditModalVisible(false);
    
    // 添加新分类
    addCustomCategory(finalCategory);
  };

  // 新增：复制物品函数
  const handleCopyItem = (originalItem) => {
    // 复制物品数据，生成新ID，添加副本后缀
    const copiedItem = {
      ...originalItem,
      id: Date.now(), // 生成唯一新ID
      name: `${originalItem.name}（副本）`, // 自动添加副本后缀
      isFinished: false, // 复制的物品默认未耗尽
      usedCount: '0', // 重置使用次数
      inTrash: false, // 确保不在回收站
      image: null // 清空图片（可根据需求改为保留：image: originalItem.image）
    };

    // 记忆分类
    setRecentCategory(originalItem.category);
    
    // 添加新物品到列表
    setItems([...items, copiedItem]);
    
    // 自动滚动到添加表单区域
    const formTitle = document.querySelector('h2:text("添加新物品")');
    if (formTitle) {
      formTitle.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 提示用户复制成功
    alert(`已复制物品「${originalItem.name}」，新物品已添加到列表！`);
  };

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

  const handleDeleteItem = (itemId) => {
    if (window.confirm("确定删除该物品吗？删除后无法恢复！")) {
      setItems(items.filter(i => i.id !== itemId));
    }
  };

  // ========== 穿搭功能 ==========
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
    
    // 更新物品使用次数
    const updatedItems = items.map(item => {
      if (selectedOutfitItems.includes(item.id) && !item.isFinished) {
        return { ...item, usedCount: (item.usedCount || 0) + 1 };
      }
      return item;
    });
    setItems(updatedItems);

    // 保存穿搭记录
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
  const handleAddTransaction = (newTrans) => {
    setTransactions([...transactions, newTrans]);
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

  const filteredTransactions = transactions
    .filter(t => t.note.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ========== 渲染 ==========
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* 版本更新提醒 */}
      {(showUpdateAlert || updateAvailable) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">🎉 {updateAvailable ? "新版本可用" : "版本更新完成"}</h3>
              {updateAvailable ? (
                <>
                  <p className="mt-1 text-sm">当前版本：v{CURRENT_VERSION} | 最新版本：v{newVersion}</p>
                  <p className="mt-2 text-xs opacity-90">
                    ✅ 物品卡片折叠展示 ✅ 分类记忆/删除 ✅ 数据导入功能<br/>
                    ✅ 版本自动更新 ✅ 移除OCR识图 ✅ 价格计算器 ✅ 性能优化
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm">已更新到最新版本 v{CURRENT_VERSION}</p>
              )}
            </div>
            <div className="flex gap-2">
              {updateAvailable && (
                <button 
                  onClick={performUpdate}
                  className="px-2 py-1 bg-white text-green-700 rounded text-xs font-medium hover:bg-gray-100"
                >
                  立即更新
                </button>
              )}
              <button 
                onClick={() => {
                  setShowUpdateAlert(false);
                  setUpdateAvailable(false);
                }}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">米米去处 · 全能管理</h1>
          <div className="flex gap-2">
            <button 
              onClick={exportData}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              导出数据
            </button>
            <label className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
              导入数据
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
            {importStatus && (
              <p className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{importStatus}</p>
            )}
          </div>
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
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">v{CURRENT_VERSION} | 数据仅保存在本地，安全无忧</p>
          <button 
            onClick={checkVersionUpdate}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            检查更新
          </button>
        </div>
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
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 物品添加表单 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-100">
              添加新物品
            </h2>
            <ItemForm 
              categories={categories} 
              onSubmit={handleAddItem}
              recentCategory={recentCategory}
            />
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
                    <div className="mt-3 space-y-2">
                      {groupedItems[category].map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onEdit={(item) => {
                            setCurrentEditItem(item);
                            setEditModalVisible(true);
                          }}
                          onDelete={handleDeleteItem}
                          onUseOnce={handleUseOnce}
                          onMarkFinished={handleMarkFinished}
                          onCopy={handleCopyItem} // 传递复制回调
                          initiallyCollapsed={true}
                        />
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
                      <p className="text-xs text-gray-500 text-center mt-1">¥{(item.price / (item.usedCount + 1)).toFixed(2)}/次</p>
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
              <p className="text-2xl font-bold text-red-600">¥{getFinanceStats(transactions).totalExpense}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <h3 className="text-sm text-gray-500 mb-1">总收入</h3>
              <p className="text-2xl font-bold text-green-600">¥{getFinanceStats(transactions).totalIncome}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <h3 className="text-sm text-gray-500 mb-1">账户余额</h3>
              <p className={`text-2xl font-bold ${getFinanceStats(transactions).balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ¥{getFinanceStats(transactions).balance}
              </p>
            </div>
          </div>

          {/* 添加记账记录 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-600 mb-4 border-b pb-2 border-gray-100">
              添加记账记录
            </h2>
            <TransactionForm onAdd={handleAddTransaction} />
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
              <ItemForm 
                item={currentEditItem}
                categories={categories} 
                onSubmit={handleEditItem}
                recentCategory={recentCategory}
              />
            </div>

            <div className="p-4 border-t flex gap-3 justify-end">
              <button
                onClick={() => setEditModalVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}