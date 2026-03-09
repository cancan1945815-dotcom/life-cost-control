import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("life_cost_items");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = "long";
  const [category, setCategory] = useState("其他");
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [image, setImage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({});

  // ====================== 每日穿搭 ======================
  const [outfitHistory, setOutfitHistory] = useState(() => {
    const saved = localStorage.getItem("outfit_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // 本地保存
  useEffect(() => {
    localStorage.setItem("life_cost_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("outfit_history", JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  const typeCategories = ["电子产品", "服饰", "食品", "日用品", "其他", ...Array.from(new Set(items.map(i => i.category)))];

  const toggleCollapse = (cat) => {
    setCollapsed({ ...collapsed, [cat]: !collapsed[cat] });
  };

  // ====================== 成本计算（含附加） ======================
  const getTotalCost = (item) => {
    const base = item.price || 0;
    const extra = (item.additionalCosts || []).reduce((s, c) => s + (c.amt || 0), 0);
    return base + extra;
  };

  const getDayCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    const buy = new Date(item.purchaseDate);
    const now = new Date();
    const days = Math.max(1, Math.floor((now - buy) / (1000 * 60 * 60 * 24)));
    return (getTotalCost(item) / days).toFixed(2);
  };

  const getUseCost = (item) => {
    const total = getTotalCost(item);
    const cnt = Math.max(1, item.usedCount || 1);
    return (total / cnt).toFixed(2);
  };

  // ====================== OCR ======================
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
      tessedit_char_whitelist: "0123456789.-年月日",
      preserve_interword_spaces: "1",
    })
      .then(({ data: { text } }) => {
        const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
        let detectedName = "", detectedPrice = "", detectedDate = "";
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

  const resetForm = () => {
    setName(""); setPrice(""); setPurchaseDate(""); setExpireDate("");
    setType("long"); setCategory("其他"); setQuantity(""); setUsedCount("");
    setAdditionalCosts([]); setImage(null); setEditingId(null);
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
      isFinished: false, // 是否已耗尽
    };

    if (editingId) {
      setItems(items.map(i => i.id !== editingId ? i : { ...i, ...common }));
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
    const desc = prompt("附加成本描述");
    const amt = prompt("金额");
    if (!desc || !amt) return;
    setAdditionalCosts([...additionalCosts, { desc, amt: Number(amt) }]);
  };

  const removeImage = () => setImage(null);

  // ====================== 消耗品：使用一次 ======================
  const handleUseOnce = (item) => {
    if (item.type !== "consume") return;
    if (item.isFinished) {
      alert("已耗尽，无法再使用");
      return;
    }
    setItems(items.map(it => {
      if (it.id === item.id) {
        return { ...it, usedCount: (it.usedCount || 0) + 1 };
      }
      return it;
    }));
  };

  // ====================== 消耗品：标记耗尽 ======================
  const handleFinish = (item) => {
    if (item.type !== "consume") return;
    setItems(items.map(it => {
      if (it.id === item.id) {
        return { ...it, isFinished: true };
      }
      return it;
    }));
    alert("已标记为耗尽！最终单次使用成本已固定");
  };

  // ====================== 穿搭：选择物品 ======================
  const toggleSelectItem = (itemId) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // ====================== 保存今日穿搭 ======================
  const saveTodayOutfit = () => {
    if (selectedItemIds.length === 0) {
      alert("请至少选择一件物品");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const updatedItems = items.map(it => {
      if (selectedItemIds.includes(it.id)) {
        if (it.type === "consume" && !it.isFinished) {
          return { ...it, usedCount: (it.usedCount || 0) + 1 };
        }
      }
      return it;
    });
    setItems(updatedItems);

    const newRecord = { date: today, itemIds: selectedItemIds };
    const exists = outfitHistory.find(r => r.date === today);
    setOutfitHistory(exists
      ? outfitHistory.map(r => r.date === today ? newRecord : r)
      : [...outfitHistory, newRecord]
    );
    setSelectedItemIds([]);
    alert("今日穿搭已保存！消耗品使用次数+1");
  };

  const activeItems = items
    .filter(i => !i.inTrash)
    .filter(i => filterCategory === "全部" || i.category === filterCategory)
    .filter(i => !search || i.name.includes(search));

  // ====================== 渲染 ======================
  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">米米去处</h1>

      <div className="mb-6 flex gap-3">
        <button onClick={() => { document.getElementById("tab1").style.display = "block"; document.getElementById("tab2").style.display = "none"; }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg">物品管理</button>
        <button onClick={() => { document.getElementById("tab1").style.display = "none"; document.getElementById("tab2").style.display = "block"; }}
          className="bg-pink-600 text-white px-4 py-2 rounded-lg">每日穿搭</button>
      </div>

      {/* ====================== 物品页面 ====================== */}
      <div id="tab1" style={{ display: "block" }}>
        <div className="flex gap-3 mb-4">
          <input className="border p-2 rounded flex-1" placeholder="搜索物品" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="border p-2 rounded min-w-[140px]" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="全部">全部分类</option>
            {typeCategories.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="bg-white p-6 rounded-xl shadow mb-6 space-y-3">
          <h2 className="text-xl font-semibold">{editingId ? "编辑物品" : "添加物品"}</h2>
          {editingId && <button onClick={resetForm} className="bg-gray-400 text-white p-2 rounded w-full">取消编辑</button>}
          <input className="border p-2 w-full rounded" placeholder="物品名称" value={name} onChange={e => setName(e.target.value)} />
          <input className="border p-2 w-full rounded" placeholder="价格" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          <input className="border p-2 w-full rounded" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          <input className="border p-2 w-full rounded" type="date" value={expireDate} onChange={e => setExpireDate(e.target.value)} placeholder="到期日(可选)" />

          <select className="border p-2 w-full rounded" value={type} onChange={e => setType(e.target.value)}>
            <option value="long">长期物品</option>
            <option value="consume">消耗品 / 服饰</option>
          </select>

          <select className="border p-2 w-full rounded" value={category} onChange={e => setCategory(e.target.value)}>
            {typeCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {type === "consume" && (
            <>
              <input className="border p-2 w-full rounded" placeholder="总数量(可选)" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
              <input className="border p-2 w-full rounded" placeholder="已使用次数" type="number" value={usedCount} onChange={e => setUsedCount(e.target.value)} />
            </>
          )}

          <button onClick={addAdditionalCost} className="bg-purple-600 text-white p-2 rounded w-full">添加附加成本</button>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {ocrLoading && <p className="text-blue-600">OCR识别中...</p>}
          {image && <img src={image} className="w-24 h-24 object-cover rounded" />}
          <button onClick={addOrUpdateItem} className="bg-blue-600 text-white p-2 rounded w-full">{editingId ? "保存修改" : "添加物品"}</button>
        </div>

        {typeCategories.filter(c => c !== "全部").map(cat => {
          const list = activeItems.filter(i => i.category === cat);
          if (list.length === 0) return null;
          return (
            <div key={cat} className="mb-4">
              <div className="bg-gray-200 p-3 rounded-lg flex justify-between cursor-pointer" onClick={() => toggleCollapse(cat)}>
                <span className="font-medium">{cat}（{list.length}）</span>
                <span>{collapsed[cat] ? "▲ 收起" : "▼ 展开"}</span>
              </div>

              {!collapsed[cat] && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {list.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow">
                      <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                      <p className="text-sm">价格：{item.price} 元</p>
                      <p className="text-sm">购买：{item.purchaseDate}</p>

                      {item.type === "long" && (
                        <p className="text-green-700 font-medium mt-1">每日成本：¥{getDayCost(item)}</p>
                      )}

                      {item.type === "consume" && (
                        <div className="mt-1">
                          <p className="text-blue-700 font-medium">单次成本：¥{getUseCost(item)}</p>
                          <p className="text-sm">已使用：{item.usedCount || 0} 次</p>
                          {item.isFinished && <p className="text-red-600 font-bold">✅ 已耗尽 · 最终成本</p>}
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-2">
                        {item.type === "consume" && !item.isFinished && (
                          <button onClick={() => handleUseOnce(item)} className="bg-blue-500 text-white py-1 rounded">使用一次（+1）</button>
                        )}
                        {item.type === "consume" && !item.isFinished && (
                          <button onClick={() => handleFinish(item)} className="bg-red-500 text-white py-1 rounded">标记为已耗尽</button>
                        )}
                        <button onClick={() => startEdit(item)} className="bg-yellow-400 py-1 rounded">编辑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ====================== 每日穿搭 ====================== */}
      <div id="tab2" style={{ display: "none" }}>
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">今日穿搭 · 选择使用的物品</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {activeItems.map(it => (
              <div
                key={it.id}
                onClick={() => toggleSelectItem(it.id)}
                className={`border p-3 rounded cursor-pointer ${selectedItemIds.includes(it.id) ? "bg-pink-100 border-pink-400" : ""}`}
              >
                <p className="font-medium">{it.name}</p>
                <p className="text-sm">成本：¥{it.type === "long" ? getDayCost(it) : getUseCost(it)}</p>
              </div>
            ))}
          </div>
          <button onClick={saveTodayOutfit} className="bg-pink-600 text-white p-3 rounded w-full">
            保存今日穿搭（消耗品使用次数+1）
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">历史穿搭记录</h2>
          {outfitHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).map(record => {
            const usedItems = items.filter(i => record.itemIds.includes(i.id));
            return (
              <div key={record.date} className="border-b pb-3 mb-3">
                <p className="font-bold">{record.date}</p>
                {usedItems.map(i => (
                  <p key={i.id}>- {i.name} · 成本：¥{i.type === "long" ? getDayCost(i) : getUseCost(i)}</p>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}