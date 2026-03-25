import React, { useState, useEffect, useRef } from "react";
import ItemForm from "./components/ItemForm";
import ItemCard from "./components/ItemCard";
import TransactionForm from "./components/TransactionForm";

// 常量定义
const CURRENT_VERSION = "4.0.0";
const VERSION_STORAGE_KEY = "item_manager_version";
const STORAGE_KEYS = {
  ITEMS: "item_manager_items",
  OUTFIT_HISTORY: "item_manager_outfit_history",
  TRANSACTIONS: "item_manager_transactions",
  CATEGORIES: "item_manager_categories",
  RECENT_CATEGORY: "item_manager_recent_category"
};
const DEFAULT_CATEGORIES = ["服饰", "美妆", "食品", "日用品", "数码产品"];

// 工具函数
const safeParseStorage = (key, defaultValue) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error(`解析本地存储 ${key} 失败`, e);
    return defaultValue;
  }
};

const getFinanceStats = (transactions) => {
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
    
  const balance = totalIncome - totalExpense;
  
  return {
    totalExpense: totalExpense.toFixed(2),
    totalIncome: totalIncome.toFixed(2),
    balance: balance.toFixed(2)
  };
};

export default function App() {
  // 核心状态
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

  // 辅助状态
  const [activeTab, setActiveTab] = useState("items");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({});
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  
  const fileInputRef = useRef(null);
  const addItemModalRef = useRef(null);

  // 统一本地存储同步（优化：合并多个useEffect）
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEYS.OUTFIT_HISTORY, JSON.stringify(outfitHistory));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEYS.RECENT_CATEGORY, recentCategory);
  }, [items, outfitHistory, transactions, categories, recentCategory]);

  // 初始化折叠状态
  useEffect(() => {
    const initial = {};
    categories.forEach(cat => initial[cat] = true);
    setCollapsed(prev => ({ ...prev, ...initial }));
  }, [categories]);

  // 版本初始化检查
  useEffect(() => {
    checkVersionUpdate();
    const saved = localStorage.getItem(VERSION_STORAGE_KEY);
    if (!saved || saved !== CURRENT_VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    }
  }, []);

  // 版本更新检查（修复：不会无限提示更新）
  const checkVersionUpdate = async () => {
    try {
      // 这里可替换为真实接口获取 latestVersion
      const latestVersion = CURRENT_VERSION;
      if (latestVersion > CURRENT_VERSION) {
        setUpdateAvailable(true);
        setNewVersion(latestVersion);
      }
    } catch (e) {
      console.log("版本检查失败", e);
    }
  };

  const performUpdate = () => {
    localStorage.removeItem(VERSION_STORAGE_KEY);
    window.location.reload();
    setUpdateAvailable(false);
  };

  // 数据导出
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

  // 数据导入
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported || typeof imported !== "object") throw new Error("无效文件");

        const newItems = [...items];
        const newOutfits = [...outfitHistory];
        const newTrans = [...transactions];
        const newCats = [...new Set([...categories, ...(imported.categories || [])])];

        imported.items?.forEach(item => {
          if (item.id && !newItems.some(i => i.id === item.id)) newItems.push(item);
        });
        imported.outfitHistory?.forEach(o => {
          if (o.date && !newOutfits.some(n => n.date === o.date)) newOutfits.push(o);
        });
        imported.transactions?.forEach(t => {
          if (t.id && !newTrans.some(n => n.id === t.id)) newTrans.push(t);
        });

        setItems(newItems);
        setOutfitHistory(newOutfits);
        setTransactions(newTrans);
        setCategories(newCats);
        setImportStatus(`✅ 导入成功：物品${imported.items?.length||0} / 穿搭${imported.outfitHistory?.length||0} / 记账${imported.transactions?.length||0}`);
      } catch (err) {
        setImportStatus(`❌ 导入失败：${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 分类与折叠
  const toggleCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const deleteCategory = (catToDelete) => {
    if (!window.confirm(`确定删除分类「${catToDelete}」？`)) return;
    setCategories(categories.filter(c => c !== catToDelete));
    if (filterCategory === catToDelete) setFilterCategory("全部");
  };

  const addCustomCategory = (newCat) => {
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    }
  };

  // 物品操作
  const handleAddItem = (itemData, finalCategory) => {
    setRecentCategory(finalCategory);
    setItems(prev => [...prev, itemData]);
    setCollapsed(prev => ({ ...prev, [finalCategory]: true }));
    addCustomCategory(finalCategory);
    setShowAddItemModal(false);
  };

  const handleEditItem = (updatedItem, finalCategory) => {
    setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
    setEditModalVisible(false);
    addCustomCategory(finalCategory);
  };

  const handleCopyItem = (originalItem) => {
    const copied = {
      ...originalItem,
      id: Date.now(),
      name: `${originalItem.name}（副本）`,
      isFinished: false,
      usedCount: 0,
      inTrash: false,
      image: null
    };
    setRecentCategory(originalItem.category);
    setItems(prev => [...prev, copied]);
    alert(`✅ 已复制：${originalItem.name}`);
  };

  const handleUseOnce = (itemId) => {
    setItems(items.map(i => {
      if (i.id === itemId && i.type === "consume" && !i.isFinished) {
        return { ...i, usedCount: (i.usedCount || 0) + 1 };
      }
      return i;
    }));
  };

  const handleUseMinus = (itemId) => {
    setItems(items.map(i => {
      if (i.id === itemId && i.type === "consume") {
        return { ...i, usedCount: Math.max(0, (i.usedCount || 0) - 1) };
      }
      return i;
    }));
  };

  const handleMarkFinished = (itemId) => {
    if (!window.confirm("确定标记为已耗尽？")) return;
    setItems(items.map(i => i.id === itemId && i.type === "consume" ? { ...i, isFinished: true } : i));
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm("确定删除？不可恢复！")) return;
    setItems(items.filter(i => i.id !== itemId));
  };

  // 穿搭
  const outfitAvailableItems = items.filter(item => 
    item.category === "服饰" && 
    item.type === "consume" && 
    !item.isFinished &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOutfitItem = (itemId) => {
    setSelectedOutfitItems(prev => prev.includes(itemId) 
      ? prev.filter(id => id !== itemId) 
      : [...prev, itemId]
    );
  };

  const saveTodayOutfit = () => {
    if (selectedOutfitItems.length === 0) return alert("请至少选择一件服饰");
    const today = new Date().toISOString().split("T")[0];
    
    const updatedItems = items.map(i => 
      selectedOutfitItems.includes(i.id) && !i.isFinished
        ? { ...i, usedCount: (i.usedCount || 0) + 1 }
        : i
    );
    
    const newRecord = { date: today, itemIds: selectedOutfitItems, note: "" };
    const exists = outfitHistory.findIndex(r => r.date === today);
    const newHistory = exists >= 0
      ? outfitHistory.map((r, i) => i === exists ? newRecord : r)
      : [...outfitHistory, newRecord].sort((a, b) => new Date(b.date) - new Date(a.date));

    setItems(updatedItems);
    setOutfitHistory(newHistory);
    setSelectedOutfitItems([]);
    alert("✅ 今日穿搭已保存");
  };

  const deleteOutfitRecord = (date) => {
    if (!window.confirm("确定删除该穿搭记录？")) return;
    setOutfitHistory(outfitHistory.filter(r => r.date !== date));
  };

  // 记账
  const handleAddTransaction = (newTrans) => {
    setTransactions(prev => [...prev, newTrans]);
  };

  const deleteTransaction = (id) => {
    if (!window.confirm("确定删除该记账？")) return;
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // 筛选数据
  const filteredItems = items
    .filter(i => !i.inTrash)
    .filter(i => filterCategory === "全部" || i.category === filterCategory)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  const groupedItems = filteredItems.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const filteredTransactions = transactions
    .filter(t => 
      t.note?.toLowerCase().includes(search.toLowerCase()) || 
      t.category?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const finance = getFinanceStats(transactions);
  
  // 点击遮罩关闭弹窗
  const handleOverlayClick = (e, setModal) => {
    if (e.target === e.currentTarget) setModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6 max-w-5xl mx-auto font-sans">
      {/* 版本更新 */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl z-50 max-w-md w-full border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg text-green-600">🎉 新版本可用</h3>
              <p className="text-sm text-gray-600 mt-1">当前：v{CURRENT_VERSION} | 最新：v{newVersion}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={performUpdate} className="px-2 py-1 bg-green-600 text-white rounded text-xs">立即更新</button>
              <button onClick={() => setUpdateAvailable(false)} className="text-gray-500">×</button>
            </div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">米米去处 · 全能管理</h1>
            <p className="text-xs text-gray-500 mt-1">本地数据管理，安全又省心</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportData} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow">导出数据</button>
            <label className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow cursor-pointer">
              导入数据
              <input type="file" accept=".json" onChange={handleFileSelect} ref={fileInputRef} className="hidden" />
            </label>
            {importStatus && <p className="text-xs bg-gray-100 px-3 py-2 rounded-lg self-center">{importStatus}</p>}
          </div>
        </div>
        
        {/* 标签页 */}
        <div className="flex border-b border-gray-200 mt-4 overflow-x-auto gap-1">
          {["items", "outfit", "finance"].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-6 font-medium text-sm relative ${
                activeTab === tab ? ["text-blue-600","text-pink-600","text-green-600"][idx] : "text-gray-500"
              }`}
            >
              {{items:"物品管理",outfit:"每日穿搭",finance:"记账管理"}[tab]}
              {activeTab === tab && <span className={`absolute bottom-0 w-full h-1 rounded-t-sm ${
                ["bg-blue-600","bg-pink-600","bg-green-600"][idx]
              }`}></span>}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">v{CURRENT_VERSION}</p>
          <button onClick={checkVersionUpdate} className="text-xs text-blue-500 flex items-center gap-1">检查更新</button>
        </div>
      </header>

      {/* 物品管理 */}
      {activeTab === "items" && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-col sm:flex-row gap-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索物品名称..." className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-300 outline-none" />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 border rounded-lg bg-white">
              <option value="全部">全部分类</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mb-8">
            <button onClick={() => setShowAddItemModal(true)} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow flex items-center justify-center gap-2">
              添加新物品
            </button>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6">我的物品列表</h2>
            {Object.keys(groupedItems).length === 0 ? (
              <div className="bg-white rounded-xl p-10 text-center border">暂无物品</div>
            ) : (
              Object.keys(groupedItems).map(cat => (
                <div key={cat} className="mb-6">
                  <div onClick={() => toggleCollapse(cat)} className="bg-white rounded-lg px-5 py-3.5 flex justify-between items-center cursor-pointer hover:bg-gray-50 shadow border">
                    <span className="font-medium">{cat}（{groupedItems[cat].length}件）</span>
                    <span className="text-gray-500">{collapsed[cat] ? "展开" : "收起"}</span>
                  </div>
                  {!collapsed[cat] && (
                    <div className="mt-3 space-y-3">
                      {groupedItems[cat].map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          onEdit={(item) => { setCurrentEditItem(item); setEditModalVisible(true); }}
                          onDelete={handleDeleteItem}
                          onUseOnce={handleUseOnce}
                          onUseMinus={handleUseMinus}
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

      {/* 每日穿搭 */}
      {activeTab === "outfit" && (
        <div className="space-y-8 mb-12">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold text-pink-600 mb-6">今日穿搭</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索服饰..." className="w-full px-4 py-2.5 border rounded-lg mb-6" />
            {outfitAvailableItems.length === 0 ? (
              <div className="text-center py-10 text-gray-500">暂无可用服饰</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
                  {outfitAvailableItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleOutfitItem(item.id)}
                      className={`border rounded-xl p-4 cursor-pointer ${
                        selectedOutfitItems.includes(item.id) ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200" : "border-gray-200"
                      }`}
                    >
                      {item.image && <img src={item.image} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />}
                      <h3 className="font-medium text-sm text-center">{item.name}</h3>
                    </div>
                  ))}
                </div>
                <button onClick={saveTodayOutfit} className="w-full py-3.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 shadow">保存今日穿搭</button>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold text-pink-600 mb-6">历史穿搭</h2>
            {outfitHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-500">暂无记录</div>
            ) : (
              <div className="space-y-5 max-h-96 overflow-y-auto pr-2">
                {outfitHistory.map(record => (
                  <div key={record.date} className="border-b pb-5">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold">{record.date}</h3>
                      <button onClick={() => deleteOutfitRecord(record.date)} className="text-xs text-red-500">删除</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.filter(i => record.itemIds.includes(i.id)).map(i => (
                        <span key={i.id} className="px-3 py-1.5 bg-gray-100 rounded-full text-sm">{i.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 记账 */}
      {activeTab === "finance" && (
        <div className="space-y-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl p-5 border-l-4 border-red-500 shadow-sm hover:shadow">
              <h3 className="text-sm text-gray-500 mb-2">总支出</h3>
              <p className="text-2xl font-bold text-red-600">¥{finance.totalExpense}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border-l-4 border-green-500 shadow-sm hover:shadow">
              <h3 className="text-sm text-gray-500 mb-2">总收入</h3>
              <p className="text-2xl font-bold text-green-600">¥{finance.totalIncome}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border-l-4 border-blue-500 shadow-sm hover:shadow">
              <h3 className="text-sm text-gray-500 mb-2">账户余额</h3>
              <p className={`text-2xl font-bold ${finance.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>¥{finance.balance}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-xl font-semibold text-green-600 mb-6">添加记账</h2>
            <TransactionForm onAdd={handleAddTransaction} />
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-semibold text-green-600">记账记录</h2>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索备注/分类..." className="w-64 px-4 py-2 border rounded-lg text-sm" />
            </div>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">暂无记录</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {filteredTransactions.map(t => (
                  <div key={t.id} className="border-b pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className={`px-2 py-1 text-xs rounded-full mr-2 ${t.type === "expense" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {t.type === "expense" ? "支出" : "收入"}
                        </span>
                        <span className="font-medium">{t.category}</span>
                      </div>
                      <span className={`font-bold text-lg ${t.type === "expense" ? "text-red-600" : "text-green-600"}`}>
                        {t.type === "expense" ? "-" : "+"}¥{Number(t.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                      <div>{t.date} {t.note && `· ${t.note}`}</div>
                      <button onClick={() => deleteTransaction(t.id)} className="text-xs text-red-500">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 添加物品弹窗 */}
      {showAddItemModal && (
        <div ref={addItemModalRef} onClick={(e) => handleOverlayClick(e, setShowAddItemModal)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold">添加新物品</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-gray-500">×</button>
            </div>
            <div className="p-6">
              <ItemForm categories={categories} onSubmit={handleAddItem} recentCategory={recentCategory} />
            </div>
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {editModalVisible && (
        <div onClick={(e) => handleOverlayClick(e, setEditModalVisible)} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold">编辑物品</h3>
              <button onClick={() => setEditModalVisible(false)} className="text-gray-500">×</button>
            </div>
            <div className="p-6">
              <ItemForm item={currentEditItem} categories={categories} onSubmit={handleEditItem} recentCategory={recentCategory} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}