import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  // ========== 核心数据状态 ==========
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("life_cost_items");
    return saved ? JSON.parse(saved) : [];
  });

  // 新增：每日穿搭状态
  const [dailyOutfits, setDailyOutfits] = useState(() => {
    const saved = localStorage.getItem("daily_outfits");
    return saved ? JSON.parse(saved) : [];
  });
  const [todayOutfit, setTodayOutfit] = useState("");
  const [showOutfitModule, setShowOutfitModule] = useState(false);

  // ========== 表单状态 ==========
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState("其他");
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [image, setImage] = useState(null);

  // ========== 辅助状态 ==========
  const [editingId, setEditingId] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({});

  // ========== 本地存储 ==========
  useEffect(() => {
    localStorage.setItem("life_cost_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("daily_outfits", JSON.stringify(dailyOutfits));
  }, [dailyOutfits]);

  // ========== 工具函数 ==========
  // 获取所有分类（去重）
  const typeCategories = ["电子产品", "服饰", "食品", "日用品", "其他", ...Array.from(new Set(items.map(i => i.category)))];

  // 分类折叠/展开
  const toggleCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // 计算总成本（原价+附加成本）
  const getTotalCost = (item) => {
    const basePrice = item.price || 0;
    const extraCost = (item.additionalCosts || []).reduce((sum, curr) => sum + (curr.amt || 0), 0);
    return basePrice + extraCost;
  };

  // 长期物品每日成本
  const getDayCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    const buy = new Date(item.purchaseDate);
    const now = new Date();
    const diffTime = now - buy;
    const days = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const total = getTotalCost(item);
    return (total / days).toFixed(2);
  };

  // 消耗品单次成本
  const getUseCost = (item) => {
    if (item.type !== "consume") return "0.00";
    const totalCount = item.usedCount || 1;
    const total = getTotalCost(item);
    return (total / totalCount).toFixed(2);
  };

  // ========== 图片OCR相关 ==========
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
          const avg =
            0.299 * imageData.data[i] +
            0.587 * imageData.data[i + 1] +
            0.114 * imageData.data[i + 2];
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
      tessedit_char_whitelist: "0123456789.-年月日",
      preserve_interword_spaces: "1",
    })
      .then(({ data: { text } }) => {
        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
        let detectedName = "";
        let detectedPrice = "";
        let detectedDate = "";

        const priceKeywords = ["实付款", "总计", "金额", "合计"];
        for (let i = 0; i < lines.length; i++) {
          for (let kw of priceKeywords) {
            if (lines[i].includes(kw)) {
              const m = lines[i].match(/(\d+(\.\d{1,2})?)/);
              if (m) detectedPrice = m[0];
              detectedName = lines[i - 1] || lines[0];
              break;
            }
          }
          if (detectedPrice) break;
        }

        if (!detectedPrice) {
          for (let line of lines) {
            const m = line.match(/\d+(\.\d{1,2})?/);
            if (m) {
              detectedPrice = m[0];
              break;
            }
          }
        }

        for (let line of lines) {
          const m = line.match(/\d{4}-\d{2}-\d{2}/) || line.match(/\d{2}\/\d{2}\/\d{4}/);
          if (m) {
            detectedDate = m[0];
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

  // ========== 物品表单操作 ==========
  const resetForm = () => {
    setName("");
    setPrice("");
    setPurchaseDate("");
    setExpireDate("");
    setType("long");
    setCategory("其他");
    setQuantity("");
    setUsedCount("");
    setAdditionalCosts([]);
    setImage(null);
    setEditingId(null);
  };

  const addOrUpdateItem = () => {
    if (!name || !price || !purchaseDate) {
      alert("请填写名称、价格和购买日期");
      return;
    }
    const common = {
      name,
      price: Number(price),
      purchaseDate,
      expireDate,
      type,
      category: category || "其他",
      image: image || undefined,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      additionalCosts,
      inTrash: false,
    };

    if (editingId) {
      setItems(items.map((i) => i.id !== editingId ? i : { ...i, ...common }));
    } else {
      setItems([...items, { id: Date.now(), ...common }]);
    }

    resetForm();
  };

  const startEdit = (item) => {
    setName(item.name);
    setPrice(String(item.price));
    setPurchaseDate(item.purchaseDate);
    setExpireDate(item.expireDate || "");
    setType(item.type);
    setCategory(item.category);
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUsedCount(item.usedCount != null ? String(item.usedCount) : "");
    setAdditionalCosts(item.additionalCosts || []);
    setImage(item.image);
    setEditingId(item.id);
  };

  const addAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述");
    const amt = prompt("请输入附加成本金额");
    if (!desc || !amt) return;
    setAdditionalCosts([...additionalCosts, { desc, amt: Number(amt) }]);
  };

  const removeImage = () => setImage(null);

  // ========== 新增：每日穿搭功能 ==========
  const saveTodayOutfit = () => {
    if (!todayOutfit.trim()) {
      alert("请输入今日穿搭内容");
      return;
    }
    const today = new Date().toISOString().split("T")[0]; // 格式：YYYY-MM-DD
    // 检查是否已有今日记录
    const existIndex = dailyOutfits.findIndex(item => item.date === today);
    if (existIndex > -1) {
      const newOutfits = [...dailyOutfits];
      newOutfits[existIndex] = { date: today, content: todayOutfit };
      setDailyOutfits(newOutfits);
    } else {
      setDailyOutfits([...dailyOutfits, { date: today, content: todayOutfit }]);
    }
    setTodayOutfit("");
    alert("今日穿搭已保存！");
  };

  const deleteOutfit = (date) => {
    if (window.confirm("确定删除这条穿搭记录吗？")) {
      setDailyOutfits(dailyOutfits.filter(item => item.date !== date));
    }
  };

  // ========== 筛选逻辑 ==========
  const activeItems = items
    .filter(i => !i.inTrash)
    .filter(i => filterCategory === "全部" || i.category === filterCategory)
    .filter(i => search === "" || i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-5xl mx-auto">
      {/* 顶部标题与功能切换 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">米米去处</h1>
        <button
          onClick={() => setShowOutfitModule(!showOutfitModule)}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
        >
          {showOutfitModule ? "返回物品管理" : "每日穿搭"}
        </button>
      </div>

      {/* 每日穿搭模块 */}
      {showOutfitModule ? (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-pink-600">每日穿搭记录</h2>
          
          {/* 今日穿搭输入 */}
          <div className="mb-6">
            <label className="block font-medium mb-2">今日穿搭 ({new Date().toISOString().split("T")[0]})</label>
            <textarea
              className="w-full border rounded-lg p-3 h-24 resize-none"
              placeholder="例如：白色T恤 + 蓝色牛仔裤 + 小白鞋"
              value={todayOutfit}
              onChange={(e) => setTodayOutfit(e.target.value)}
            ></textarea>
            <button
              onClick={saveTodayOutfit}
              className="mt-2 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition"
            >
              保存今日穿搭
            </button>
          </div>

          {/* 历史穿搭记录 */}
          <div>
            <h3 className="text-xl font-medium mb-3">历史穿搭</h3>
            {dailyOutfits.length === 0 ? (
              <p className="text-gray-500 italic">暂无穿搭记录</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {dailyOutfits.sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => (
                  <div key={item.date} className="bg-gray-50 rounded-lg p-3 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-700">{item.date}</p>
                      <p className="text-gray-600 mt-1">{item.content}</p>
                    </div>
                    <button
                      onClick={() => deleteOutfit(item.date)}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 搜索与筛选 */}
          <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col md:flex-row gap-3">
            <input
              className="border p-2 rounded flex-1"
              placeholder="搜索物品名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border p-2 rounded min-w-[150px]"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="全部">全部分类</option>
              {typeCategories.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 物品添加/编辑表单 */}
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              {editingId ? "编辑物品" : "添加物品"}
            </h2>

            {editingId && (
              <button
                onClick={resetForm}
                className="bg-gray-400 text-white p-2 rounded w-full mb-4 hover:bg-gray-500 transition"
              >
                取消编辑
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">物品名称 *</label>
                <input
                  className="border p-2 w-full rounded"
                  placeholder="例如：纯棉T恤"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">价格 (元) *</label>
                <input
                  className="border p-2 w-full rounded"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">购买日期 *</label>
                <input
                  className="border p-2 w-full rounded"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">到期日期 (可选)</label>
                <input
                  className="border p-2 w-full rounded"
                  type="date"
                  value={expireDate}
                  onChange={(e) => setExpireDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">物品类型</label>
                <select
                  className="border p-2 w-full rounded"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="long">长期物品</option>
                  <option value="consume">消耗品</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">物品分类</label>
                <select
                  className="border p-2 w-full rounded"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {typeCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="自定义">自定义</option>
                </select>
              </div>
            </div>

            {/* 消耗品专用 */}
            {type === "consume" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">总数量 (可选)</label>
                  <input
                    className="border p-2 w-full rounded"
                    placeholder="例如：10"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">已使用次数 (可选)</label>
                  <input
                    className="border p-2 w-full rounded"
                    placeholder="例如：3"
                    type="number"
                    value={usedCount}
                    onChange={(e) => setUsedCount(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 附加成本 */}
            <div className="mb-4">
              <button
                onClick={addAdditionalCost}
                className="bg-purple-500 text-white p-2 rounded w-full hover:bg-purple-600 transition"
              >
                添加附加成本（运费/安装费等）
              </button>
              {additionalCosts.length > 0 && (
                <div className="mt-2 bg-gray-50 p-2 rounded">
                  <p className="font-medium text-sm mb-1">已添加的附加成本：</p>
                  {additionalCosts.map((a, i) => (
                    <p key={i} className="text-sm">- {a.desc}：{a.amt} 元</p>
                  ))}
                </div>
              )}
            </div>

            {/* 图片上传 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">上传凭证图片 (可选)</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {ocrLoading && <p className="text-blue-500 text-sm mt-1">正在识别图片信息...</p>}
              {image && (
                <div className="flex items-center gap-2 mt-2">
                  <img src={image} className="w-24 h-24 object-cover rounded" />
                  <button onClick={removeImage} className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                    删除图片
                  </button>
                </div>
              )}
            </div>

            {/* 提交按钮 */}
            <button
              onClick={addOrUpdateItem}
              className="bg-blue-500 text-white p-2 rounded w-full hover:bg-blue-600 transition"
            >
              {editingId ? "保存修改" : "添加物品"}
            </button>
          </div>

          {/* 物品列表（清晰分类展示） */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">我的物品列表</h2>
            
            {activeItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
                暂无符合条件的物品记录，快去添加吧！
              </div>
            ) : (
              // 按分类分组展示
              Array.from(new Set(activeItems.map(i => i.category))).map(cat => (
                <div key={cat} className="mb-5">
                  {/* 分类标题（可折叠） */}
                  <div
                    className="bg-gray-200 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-300 transition"
                    onClick={() => toggleCollapse(cat)}
                  >
                    <span className="font-medium">{cat} ({activeItems.filter(i => i.category === cat).length})</span>
                    <span>{collapsed[cat] ? "▲ 收起" : "▼ 展开"}</span>
                  </div>

                  {/* 分类下的物品卡片 */}
                  {!collapsed[cat] && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeItems
                        .filter(i => i.category === cat)
                        .map(item => (
                          <div key={item.id} className="bg-white rounded-xl shadow p-4 hover:shadow-md transition">
                            {/* 图片 */}
                            {item.image && (
                              <img src={item.image} className="w-full h-32 object-cover rounded mb-3" />
                            )}
                            
                            {/* 基础信息 */}
                            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                            <div className="grid grid-cols-2 gap-1 text-sm mb-2">
                              <p>价格：{item.price} 元</p>
                              <p>购买日期：{item.purchaseDate}</p>
                              {item.expireDate && <p>到期日期：{item.expireDate}</p>}
                              {item.type === "consume" && (
                                <p>使用进度：{item.usedCount} / {item.quantity || "未知"}</p>
                              )}
                            </div>
                            
                            {/* 成本计算（核心） */}
                            <div className="bg-green-50 p-2 rounded mb-3">
                              <p className="font-medium text-sm mb-1">成本分析：</p>
                              {item.type === "long" ? (
                                <p className="text-green-700 font-medium">
                                  每日成本（含附加）：¥{getDayCost(item)}
                                </p>
                              ) : (
                                <p className="text-blue-700 font-medium">
                                  单次成本（含附加）：¥{getUseCost(item)}
                                </p>
                              )}
                            </div>
                            
                            {/* 附加成本 */}
                            {item.additionalCosts && item.additionalCosts.length > 0 && (
                              <div className="text-sm mb-3">
                                <p className="font-medium mb-1">附加成本：</p>
                                {item.additionalCosts.map((a, i) => (
                                  <p key={i}>- {a.desc}：{a.amt} 元</p>
                                ))}
                              </div>
                            )}
                            
                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(item)}
                                className="bg-yellow-400 px-3 py-1 rounded text-sm flex-1 hover:bg-yellow-500 transition"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm flex-1 hover:bg-red-600 transition"
                              >
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
    </div>
  );
}