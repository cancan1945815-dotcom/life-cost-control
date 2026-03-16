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
  // ========== 核心状态（原有逻辑不变） ==========
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

  // ========== 辅助状态（原有逻辑不变） ==========
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
  
  const fileInputRef = useRef(null);

  // ========== 本地存储 + 初始化 + 版本更新（原有逻辑不变） ==========
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

  useEffect(() => {
    const initialCollapsed = {};
    categories.forEach(cat => {
      initialCollapsed[cat] = true;
    });
    setCollapsed(initialCollapsed);
    checkVersionUpdate();
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY) || "1.0.0";
    if (savedVersion !== CURRENT_VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    }
  }, [categories]);

  const checkVersionUpdate = async () => {
    try {
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

  // ========== 数据导入导出（原有逻辑不变） ==========
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
        const mergedItems = [...items];
        const mergedOutfits = [...outfitHistory];
        const mergedTransactions = [...transactions];
        const mergedCategories = [...new Set([...categories, ...(importedData.categories || [])])];
        if (Array.isArray(importedData.items)) {
          importedData.items.forEach(item => {
            if (item.id && !mergedItems.some(i => i.id === item.id)) {
              mergedItems.push(item);
            }
          });
        }
        if (Array.isArray(importedData.outfitHistory)) {
          importedData.outfitHistory.forEach(outfit => {
            if (outfit.date && !mergedOutfits.some(o => o.date === outfit.date)) {
              mergedOutfits.push(outfit);
            }
          });
        }
        if (Array.isArray(importedData.transactions)) {
          importedData.transactions.forEach(trans => {
            if (trans.id && !mergedTransactions.some(t => t.id === trans.id)) {
              mergedTransactions.push(trans);
            }
          });
        }
        setItems(mergedItems);
        setOutfitHistory(mergedOutfits);
        setTransactions(mergedTransactions);
        setCategories(mergedCategories);
        setImportStatus(`成功：导入 ${importedData.items?.length || 0} 个物品，${importedData.outfitHistory?.length || 0} 条穿搭记录，${importedData.transactions?.length || 0} 条记账记录`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setImportStatus(`错误：${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // ========== 工具函数（原有逻辑不变） ==========
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

  // ========== 物品操作（原有逻辑不变） ==========
  const handleAddItem = (itemData, finalCategory) => {
    setRecentCategory(finalCategory);
    setItems([...items, itemData]);
    setCollapsed(prev => ({ ...prev, [finalCategory]: true }));
    addCustomCategory(finalCategory);
  };

  const handleEditItem = (updatedItem, finalCategory) => {
    setItems(items.map(item => 
      item.id === updatedItem.id ? { ...updatedItem } : item
    ));
    setEditModalVisible(false);
    addCustomCategory(finalCategory);
  };

  const handleCopyItem = (originalItem) => {
    const copiedItem = {
      ...originalItem,
      id: Date.now(),
      name: `${originalItem.name}（副本）`,
      isFinished: false,
      usedCount: '0',
      inTrash: false,
      image: null
    };
    setRecentCategory(originalItem.category);
    setItems([...items, copiedItem]);
    const formTitle = document.querySelector('h2:text("添加新物品")');
    if (formTitle) {
      formTitle.scrollIntoView({ behavior: 'smooth' });
    }
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

  // ========== 穿搭功能（原有逻辑不变） ==========
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

  // ========== 记账功能（原有逻辑不变） ==========
  const handleAddTransaction = (newTrans) => {
    setTransactions([...transactions, newTrans]);
  };

  const deleteTransaction = (id) => {
    if (window.confirm("确定删除该条记账记录吗？")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // ========== 筛选逻辑（原有逻辑不变） ==========
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

  // ========== 渲染（美化核心） ==========
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 max-w-5xl mx-auto font-sans">
      {/* 版本更新提醒（美化） */}
      {(showUpdateAlert || updateAvailable) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-gray-800 p-4 rounded-lg shadow-xl z-50 max-w-md w-full border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-green-600">🎉 {updateAvailable ? "新版本可用" : "版本更新完成"}</h3>
              {updateAvailable ? (
                <>
                  <p className="mt-1 text-sm text-gray-600">当前版本：v{CURRENT_VERSION} | 最新版本：v{newVersion}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    ✅ 物品卡片折叠展示 ✅ 分类记忆/删除 ✅ 数据导入功能<br/>
                    ✅ 版本自动更新 ✅ 移除OCR识图 ✅ 价格计算器 ✅ 性能优化
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-600">已更新到最新版本 v{CURRENT_VERSION}</p>
              )}
            </div>
            <div className="flex gap-2">
              {updateAvailable && (
                <button 
                  onClick={performUpdate}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  立即更新
                </button>
              )}
              <button 
                onClick={() => {
                  setShowUpdateAlert(false);
                  setUpdateAvailable(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 头部（美化） */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">米米去处 · 全能管理</h1>
            <p className="text-xs text-gray-500 mt-1">本地数据管理，安全又省心</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportData}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow"
            >
              导出数据
            </button>
            <label className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow cursor-pointer">
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
              <p className="text-xs text-gray-700 bg-gray-100 px-3 py-2 rounded-lg self-center">{importStatus}</p>
            )}
          </div>
        </div>
        
        {/* 标签页切换（美化） */}
        <div className="flex border-b border-gray-200 mt-4 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("items")}
            className={`py-3 px-6 font-medium text-sm whitespace-nowrap relative transition-all ${
              activeTab === "items" 
                ? "text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            物品管理
            {activeTab === "items" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-sm"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("outfit")}
            className={`py-3 px-6 font-medium text-sm whitespace-nowrap relative transition-all ${
              activeTab === "outfit" 
                ? "text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            每日穿搭
            {activeTab === "outfit" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-pink-600 rounded-t-sm"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`py-3 px-6 font-medium text-sm whitespace-nowrap relative transition-all ${
              activeTab === "finance" 
                ? "text-green-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            记账管理
            {activeTab === "finance" && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-green-600 rounded-t-sm"></span>
            )}
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">v{CURRENT_VERSION} | 数据仅保存在本地，安全无忧</p>
          <button 
            onClick={checkVersionUpdate}
            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 11.5V9h1v2.5a.5.5 0 0 0 1 0V9h1a2 2 0 1 0-2-2H9a.5.5 0 0 0 0 1h1a1 1 0 1 1 0 2H7a.5.5 0 0 0 0 1zm1-5.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
            检查更新
          </button>
        </div>
      </header>

      {/* ========== 物品管理标签页（美化） ========== */}
      {activeTab === "items" && (
        <>
          {/* 搜索与筛选栏（美化） */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-white transition-all"
            >
              <option value="全部">全部分类</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 物品添加表单（美化） */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3 border-gray-100 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0z"/>
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-1 0A7 7 0 1 0 1 8a7 7 0 0 0 14 0z"/>
              </svg>
              添加新物品
            </h2>
            <ItemForm 
              categories={categories} 
              onSubmit={handleAddItem}
              recentCategory={recentCategory}
            />
          </div>

          {/* 物品列表（美化） */}
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.5 2.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM0 13a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V6a.5.5 0 0 0-1 0v7a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V6a.5.5 0 0 0-1 0v7z"/>
              </svg>
              我的物品列表
            </h2>

            {Object.keys(groupedItems).length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#e5e7eb" viewBox="0 0 16 16" className="mx-auto mb-4">
                  <path d="M2.5 2.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7zM0 13a1.5 1.5 0 0 0 1.5 1.5h13a1.5 1.5 0 0 0 1.5-1.5V6a.5.5 0 0 0-1 0v7a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5V6a.5.5 0 0 0-1 0v7z"/>
                </svg>
                <p className="text-gray-500 text-lg">暂无符合条件的物品记录</p>
                <p className="text-gray-400 mt-2">点击上方「添加新物品」开始记录吧！</p>
              </div>
            ) : (
              Object.keys(groupedItems).map(category => (
                <div key={category} className="mb-6">
                  <div
                    onClick={() => toggleCollapse(category)}
                    className="bg-white rounded-lg px-5 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
                  >
                    <span className="font-medium text-gray-800">{category}（{groupedItems[category].length}件）</span>
                    <span className="text-gray-500 flex items-center gap-1">
                      {collapsed[category] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M1.646 10.646a.5.5 0 0 1 .708 0L8 4.707l5.646 5.647a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708.708L8 4.707l-5.646 5.647a.5.5 0 0 1 0-.708z"/>
                        </svg>
                      )}
                      {collapsed[category] ? "展开" : "收起"}
                    </span>
                  </div>

                  {!collapsed[category] && (
                    <div className="mt-3 space-y-3">
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
                          onCopy={handleCopyItem}
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

      {/* ========== 每日穿搭标签页（美化） ========== */}
      {activeTab === "outfit" && (
        <div className="space-y-8 mb-12">
          {/* 今日穿搭选择区（美化） */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-pink-600 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
              </svg>
              今日穿搭 ({new Date().toISOString().split("T")[0]})
            </h2>
            
            <div className="mb-6">
              <input
                type="text"
                placeholder="搜索服饰..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">提示：仅显示「服饰」分类且「未耗尽」的消耗品</p>
            </div>

            {outfitAvailableItems.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#e5e7eb" viewBox="0 0 16 16" className="mx-auto mb-4">
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                </svg>
                暂无可用服饰，请先在「物品管理」中添加分类为「服饰」的消耗品。
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                  {outfitAvailableItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleOutfitItem(item.id)}
                      className={`border rounded-xl p-4 cursor-pointer transition-all shadow-sm hover:shadow ${
                        selectedOutfitItems.includes(item.id)
                          ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {item.image && (
                        <div className="w-full h-24 mb-3 overflow-hidden rounded-lg">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                        </div>
                      )}
                      <h3 className="font-medium text-sm text-center">{item.name}</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">¥{(item.price / (item.usedCount + 1)).toFixed(2)}/次</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveTodayOutfit}
                  className="w-full py-3.5 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-all shadow-sm hover:shadow"
                >
                  保存今日穿搭记录
                </button>
              </>
            )}
          </div>

          {/* 历史穿搭记录（美化） */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-pink-600 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
              </svg>
              历史穿搭记录
            </h2>
            
            {outfitHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#e5e7eb" viewBox="0 0 16 16" className="mx-auto mb-4">
                  <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                暂无历史穿搭记录
              </div>
            ) : (
              <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
                {outfitHistory.map(record => {
                  const recordItems = items.filter(item => record.itemIds.includes(item.id));
                  return (
                    <div key={record.date} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 text-lg">{record.date}</h3>
                        <button
                          onClick={() => deleteOutfitRecord(record.date)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                          </svg>
                          删除
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recordItems.map(item => (
                          <span key={item.id} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors">
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

      {/* ========== 记账管理标签页（美化） ========== */}
      {activeTab === "finance" && (
        <div className="space-y-8 mb-12">
          {/* 财务统计卡片（美化） */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-500 border border-gray-100 hover:shadow transition-all">
              <h3 className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8 10.293V4.5z"/>
                </svg>
                总支出
              </h3>
              <p className="text-2xl font-bold text-red-600">¥{getFinanceStats(transactions).totalExpense}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500 border border-gray-100 hover:shadow transition-all">
              <h3 className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4.5a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.793V5a.5.5 0 0 1 .5-.5z"/>
                </svg>
                总收入
              </h3>
              <p className="text-2xl font-bold text-green-600">¥{getFinanceStats(transactions).totalIncome}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500 border border-gray-100 hover:shadow transition-all">
              <h3 className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-7-4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 9 4z"/>
                </svg>
                账户余额
              </h3>
              <p className={`text-2xl font-bold ${getFinanceStats(transactions).balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ¥{getFinanceStats(transactions).balance}
              </p>
            </div>
          </div>

          {/* 添加记账记录（美化） */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-green-600 mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 3H2v10h12V3zM2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H2z"/>
              </svg>
              添加记账记录
            </h2>
            <TransactionForm onAdd={handleAddTransaction} />
          </div>

          {/* 记账记录列表（美化） */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-green-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm0 1c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-6 4c.628 0 1.168-.452 1.293-.892 0-.08-.008-.162-.025-.242l-.008-.015c-.012-.022-.026-.043-.04-.063-.014-.02-.028-.039-.042-.058a1.901 1.901 0 0 0-.128-.122c-.012-.012-.025-.023-.037-.035-.012-.012-.024-.023-.036-.035-.011-.011-.022-.022-.033-.033-.011-.011-.022-.021-.032-.032-.01-.01-.02-.02-.03-.03-.009-.009-.019-.018-.028-.027-.009-.009-.018-.018-.027-.027-.008-.008-.016-.016-.024-.024-.008-.008-.016-.016-.024-.024-.007-.007-.014-.014-.021-.021-.007-.007-.014-.014-.021-.021-.006-.006-.012-.012-.018-.018-.006-.006-.012-.012-.018-.018-.005-.005-.01-.01-.015-.015-.005-.005-.01-.01-.015-.015-.004-.004-.008-.008-.012-.012-.004-.004-.008-.008-.012-.012-.003-.003-.006-.006-.009-.009-.003-.003-.006-.006-.009-.009-.002-.002-.004-.004-.006-.006-.002-.002-.004-.004-.006-.006-.001-.001-.002-.002-.003-.003z"/>
                  <path d="M8 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 8a5 5 0 1 1 10 0 5 5 0 0 1-10 0z"/>
                </svg>
                记账记录
              </h2>
              <input
                type="text"
                placeholder="搜索备注/分类..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent text-sm transition-all"
              />
            </div>
            
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#e5e7eb" viewBox="0 0 16 16" className="mx-auto mb-4">
                  <path d="M12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm0 1c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-6 4c.628 0 1.168-.452 1.293-.892 0-.08-.008-.162-.025-.242l-.008-.015c-.012-.022-.026-.043-.04-.063-.014-.02-.028-.039-.042-.058a1.901 1.901 0 0 0-.128-.122c-.012-.012-.025-.023-.037-.035-.012-.012-.024-.023-.036-.035-.011-.011-.022-.022-.033-.033-.011-.011-.022-.021-.032-.032-.01-.01-.02-.02-.03-.03-.009-.009-.019-.018-.028-.027-.009-.009-.018-.018-.027-.027-.008-.008-.016-.016-.024-.024-.008-.008-.016-.016-.024-.024-.007-.007-.014-.014-.021-.021-.007-.007-.014-.014-.021-.021-.006-.006-.012-.012-.018-.018-.006-.006-.012-.012-.018-.018-.005-.005-.01-.01-.015-.015-.005-.005-.01-.01-.015-.015-.004-.004-.008-.008-.012-.012-.004-.004-.008-.008-.012-.012-.003-.003-.006-.006-.009-.009-.003-.003-.006-.006-.009-.009-.002-.002-.004-.004-.006-.006-.002-.002-.004-.004-.006-.006-.001-.001-.002-.002-.003-.003z"/>
                  <path d="M8 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM3 8a5 5 0 1 1 10 0 5 5 0 0 1-10 0z"/>
                </svg>
                暂无记账记录
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredTransactions.map(trans => (
                  <div key={trans.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`px-3 py-1.5 text-xs rounded-full font-medium mr-2 ${
                          trans.type === "expense" 
                            ? "bg-red-100 text-red-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {trans.type === "expense" ? "支出" : "收入"}
                        </span>
                        <span className="font-medium text-gray-800">{trans.category}</span>
                      </div>
                      <span className={`font-bold text-lg ${
                        trans.type === "expense" ? "text-red-600" : "text-green-600"
                      }`}>
                        {trans.type === "expense" ? "-" : "+"}¥{trans.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                      <div>
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          {trans.date}
                        </span>
                        {trans.note && (
                          <span className="ml-2 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                              <path d="M9.5 1V9h8V1h-8zm1 0v3h3V1h-3z"/>
                            </svg>
                            {trans.note}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTransaction(trans.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                        </svg>
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

      {/* ========== 编辑物品弹窗（美化） ========== */}
      {editModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .408.79l-2.5 4.5a.5.5 0 0 1-.79.196L.5 12.207l6.5-6.5 1.646 1.646z"/>
                  <path d="M14.5 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                编辑物品
              </h3>
              <button
                onClick={() => setEditModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <ItemForm 
                item={currentEditItem}
                categories={categories} 
                onSubmit={handleEditItem}
                recentCategory={recentCategory}
              />
            </div>

            <div className="p-5 border-t flex gap-3 justify-end bg-gray-50">
              <button
                onClick={() => setEditModalVisible(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
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