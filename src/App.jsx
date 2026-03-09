import React, { useState, useEffect } from "react";

// ========== 版本配置 ==========
const CURRENT_VERSION = "2.0.0";
const VERSION_STORAGE_KEY = "MY_APP_VERSION";

export default function App() {
  // ========== 核心状态 ==========
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_LIFE_COST_ITEMS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [outfitHistory, setOutfitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_OUTFIT_HISTORY");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // ========== 版本检查 ==========
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
  const [imagePreview, setImagePreview] = useState(null);

  // ========== 辅助状态 ==========
  const [activeTab, setActiveTab] = useState("items");
  const [editingId, setEditingId] = useState(null);
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

  // ========== 版本检查 ==========
  useEffect(() => {
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY) || "1.0.0";
    if (savedVersion !== CURRENT_VERSION) {
      setOldVersion(savedVersion);
      setShowUpdateAlert(true);
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

  // ========== 图片预览（仅本地，不上传、不联网） ==========
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  // ========== 重置表单 ==========
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
    setImagePreview(null);
    setEditingId(null);
  };

  // ========== 添加/保存物品 ==========
  const addOrUpdateItem = () => {
    if (!name || !price || !purchaseDate) {
      alert("请填写名称、价格和购买日期");
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
      image: imagePreview || null,
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

  // 编辑
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
    setImagePreview(item.image);
    setEditingId(item.id);
  };

  // 附加成本
  const addAdditionalCost = () => {
    const desc = prompt("成本名称：");
    const amt = prompt("金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("输入无效");
      return;
    }
    setAdditionalCosts([...additionalCosts, { desc, amt: Number(amt) }]);
  };

  const removeAdditionalCost = (i) => {
    setAdditionalCosts(additionalCosts.filter((_, idx) => idx !== i));
  };

  // 使用一次
  const handleUseOnce = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.type === "consume" && !item.isFinished) {
        return { ...item, usedCount: (item.usedCount || 0) + 1 };
      }
      return item;
    }));
  };

  // 标记耗尽
  const handleMarkFinished = (itemId) => {
    if (window.confirm("确认标记为已耗尽？")) {
      setItems(items.map(item =>
        item.id === itemId ? { ...item, isFinished: true } : item
      ));
    }
  };

  // ========== 穿搭 ==========
  const outfitItems = items.filter(it =>
    it.category === "服饰" &&
    it.type === "consume" &&
    !it.isFinished &&
    it.name.toLowerCase().includes(search.toLowerCase())
  );

  const saveTodayOutfit = () => {
    if (selectedOutfitItems.length === 0) {
      alert("请选择服饰");
      return;
    }
    const today = new Date().toISOString().split("T")[0];

    const updated = items.map(it => {
      if (selectedOutfitItems.includes(it.id)) {
        return { ...it, usedCount: (it.usedCount || 0) + 1 };
      }
      return it;
    });
    setItems(updated);

    const record = {
      date: today,
      itemIds: selectedOutfitItems
    };

    const exists = outfitHistory.findIndex(h => h.date === today);
    let newHistory;
    if (exists >= 0) {
      newHistory = outfitHistory.map((h, i) => i === exists ? record : h);
    } else {
      newHistory = [...outfitHistory, record].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    setOutfitHistory(newHistory);
    setSelectedOutfitItems([]);
    alert("已保存今日穿搭");
  };

  const deleteOutfit = (date) => {
    setOutfitHistory(outfitHistory.filter(h => h.date !== date));
  };

  // 筛选
  const filtered = items
    .filter(it => !it.inTrash)
    .filter(it => filterCategory === "全部" || it.category === filterCategory)
    .filter(it => it.name.toLowerCase().includes(search.toLowerCase()));

  const grouped = filtered.reduce((map, it) => {
    if (!map[it.category]) map[it.category] = [];
    map[it.category].push(it);
    return map;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-4xl mx-auto">

      {showUpdateAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full">
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">🎉 版本已更新</h3>
              <p className="text-sm mt-1">v{oldVersion} → v{CURRENT_VERSION}</p>
              <p className="text-xs mt-2">✅ 无外网依赖 ✅ 无需VPN ✅ 稳定运行</p>
            </div>
            <button onClick={() => setShowUpdateAlert(false)}>×</button>
          </div>
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">物品与穿搭管理</h1>
        <div className="flex border-b border-gray-200 mt-4">
          <button onClick={() => setActiveTab("items")}
            className={`py-2 px-4 ${activeTab === "items" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>
            物品管理
          </button>
          <button onClick={() => setActiveTab("outfit")}
            className={`py-2 px-4 ${activeTab === "outfit" ? "border-b-2 border-pink-600 text-pink-600" : "text-gray-500"}`}>
            每日穿搭
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">v{CURRENT_VERSION}｜无外网依赖版</p>
      </header>

      {activeTab === "items" && (
        <>
          <div className="bg-white rounded-lg p-3 mb-6 flex flex-col sm:flex-row gap-3">
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索物品"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-md">
              <option value="全部">全部分类</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-lg p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{editingId ? "编辑物品" : "添加物品"}</h2>

            {editingId && (
              <button onClick={resetForm} className="w-full mb-4 py-2 bg-gray-200 rounded-md">
                取消编辑
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm">物品名称 *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="text-sm">价格 *</label>
                <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="text-sm">购买日期 *</label>
                <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="text-sm">到期日（可选）</label>
                <input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md" />
              </div>

              <div>
                <label className="text-sm">物品类型</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md">
                  <option value="long">长期物品</option>
                  <option value="consume">消耗品</option>
                </select>
              </div>

              <div>
                <label className="text-sm">分类</label>
                <select value={category} onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value !== "自定义") setCustomCategory("");
                }} className="w-full px-3 py-2 border rounded-md">
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="自定义">自定义分类</option>
                </select>
                {category === "自定义" && (
                  <input
                    value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="输入分类名称"
                    className="w-full mt-2 px-3 py-2 border rounded-md" />
                )}
              </div>

              {type === "consume" && (
                <>
                  <div>
                    <label className="text-sm">总数量（可选）</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm">已使用次数</label>
                    <input type="number" value={usedCount} onChange={(e) => setUsedCount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md" />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm">附加成本</label>
                <button onClick={addAdditionalCost} className="text-sm px-2 py-1 bg-purple-500 text-white rounded">
                  添加
                </button>
              </div>
              {additionalCosts.length > 0 && (
                <div className="mt-2 space-y-1">
                  {additionalCosts.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{c.desc} {c.amt.toFixed(2)}元</span>
                      <button onClick={() => removeAdditionalCost(i)} className="text-red-500">删</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="text-sm">图片（本地预览，不上传）</label>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="w-full" />
              {imagePreview && (
                <img src={imagePreview} className="h-20 w-20 object-cover rounded mt-2" alt="预览" />
              )}
            </div>

            <button onClick={addOrUpdateItem}
              className="w-full mt-6 py-3 bg-blue-600 text-white rounded-md font-medium">
              {editingId ? "保存修改" : "添加物品"}
            </button>
          </div>

          <div className="space-y-5">
            {Object.keys(grouped).length === 0 ? (
              <div className="bg-white p-6 rounded-lg text-center text-gray-500">暂无物品</div>
            ) : (
              Object.keys(grouped).map(cat => (
                <div key={cat} className="bg-white rounded-lg">
                  <div onClick={() => toggleCollapse(cat)}
                    className="px-4 py-3 bg-gray-100 rounded-lg flex justify-between cursor-pointer">
                    <span className="font-medium">{cat}（{grouped[cat].length}）</span>
                    <span>{collapsed[cat] ? "收起" : "展开"}</span>
                  </div>

                  {!collapsed[cat] && (
                    <div className="p-3 space-y-3">
                      {grouped[cat].map(item => (
                        <div key={item.id} className="border rounded-lg p-3">
                          <div className="flex gap-3">
                            {item.image && (
                              <img src={item.image} className="w-16 h-16 rounded object-cover" alt="" />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-bold">{item.name}</span>
                                {item.type === "consume" && (
                                  <span className={`text-xs px-2 py-0.5 rounded ${item.isFinished ? "bg-red-100" : "bg-green-100"}`}>
                                    {item.isFinished ? "已耗尽" : "使用中"}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                总价 ¥{getTotalCost(item).toFixed(2)}
                              </div>
                              <div className="mt-2 text-sm">
                                {item.type === "long" ? (
                                  <div>每日成本：¥{getDayCost(item)}</div>
                                ) : (
                                  <div>单次成本：¥{getUseCost(item)}（已用 {item.usedCount || 0}）</div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.type === "consume" && !item.isFinished && (
                              <>
                                <button onClick={() => handleUseOnce(item.id)}
                                  className="px-2 py-1 text-sm bg-green-500 text-white rounded">
                                  使用一次
                                </button>
                                <button onClick={() => handleMarkFinished(item.id)}
                                  className="px-2 py-1 text-sm bg-red-500 text-white rounded">
                                  标记耗尽
                                </button>
                              </>
                            )}
                            <button onClick={() => startEdit(item)}
                              className="px-2 py-1 text-sm bg-gray-200 rounded">
                              编辑
                            </button>
                            <button onClick={() => {
                              if (window.confirm("删除？")) setItems(items.filter(i => i.id !== item.id));
                            }} className="px-2 py-1 text-sm bg-gray-200 text-red-600 rounded">
                              删除
                            </button>
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
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-4">
            <h2 className="font-semibold mb-3">今日穿搭</h2>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索服饰"
              className="w-full px-3 py-2 border rounded-md mb-4"
            />

            {outfitItems.length === 0 ? (
              <div className="text-gray-500 text-center py-4">暂无可用服饰</div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {outfitItems.map(it => (
                    <div
                      key={it.id}
                      onClick={() => setSelectedOutfitItems(prev =>
                        prev.includes(it.id) ? prev.filter(i => i !== it.id) : [...prev, it.id]
                      )}
                      className={`border rounded-lg p-3 cursor-pointer ${selectedOutfitItems.includes(it.id) ? "border-pink-500 bg-pink-50" : ""}`}>
                      {it.image && <img src={it.image} className="w-full h-16 object-cover rounded mb-2" alt="" />}
                      <div className="text-sm text-center">{it.name}</div>
                    </div>
                  ))}
                </div>

                <button onClick={saveTodayOutfit}
                  className="w-full mt-4 py-3 bg-pink-600 text-white rounded-md font-medium">
                  保存今日穿搭
                </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg p-4">
            <h2 className="font-semibold mb-3">历史记录</h2>
            {outfitHistory.length === 0 ? (
              <div className="text-gray-500 text-center py-4">暂无记录</div>
            ) : (
              <div className="space-y-3">
                {outfitHistory.map(h => (
                  <div key={h.date} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{h.date}</span>
                      <button onClick={() => deleteOutfit(h.date)} className="text-red-500 text-sm">删除</button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {items.filter(i => h.itemIds.includes(i.id)).map(i => (
                        <span key={i.id} className="text-xs bg-gray-100 px-2 py-1 rounded-full">{i.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}