import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  // ====================== 核心：本地永久存储 ======================
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_ITEMS_V2");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [outfitHistory, setOutfitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_OUTFIT");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // 自动保存到本地，永远不丢
  useEffect(() => {
    localStorage.setItem("MY_ITEMS_V2", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("MY_OUTFIT", JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  // ====================== 表单状态 ======================
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState("服饰");
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [image, setImage] = useState(null);

  const [activeTab, setActiveTab] = useState("items");
  const [editingId, setEditingId] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({});
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);

  // ====================== 工具函数 ======================
  const allCategories = ["服饰","电子产品","食品","日用品","其他",...Array.from(new Set(items.map(i=>i.category)))];

  const toggleCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getTotalCost = (item) => {
    const base = item.price || 0;
    const extra = (item.additionalCosts || []).reduce((s,c)=>s+(c.amt||0),0);
    return base + extra;
  };

  const getDayCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    const buy = new Date(item.purchaseDate);
    const now = new Date();
    const days = Math.max(1, Math.floor((now - buy) / 86400000));
    return (getTotalCost(item) / days).toFixed(2);
  };

  const getUseCost = (item) => {
    const total = getTotalCost(item);
    const cnt = Math.max(1, item.usedCount || 0);
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

  const performOCR = async (file) => {
    setOcrLoading(true);
    Tesseract.recognize(file, "chi_sim+eng")
      .then(({ data: { text } }) => {
        const p = text.match(/\d+(\.\d{1,2})?/);
        const d = text.match(/\d{4}-\d{2}-\d{2}/);
        if (p) setPrice(p[0]);
        if (d) setPurchaseDate(d[0]);
      })
      .finally(() => setOcrLoading(false));
  };

  // ====================== 物品操作 ======================
  const resetForm = () => {
    setName("");setPrice("");setPurchaseDate("");setExpireDate("");
    setType("long");setCategory("服饰");setQuantity("");setUsedCount("");
    setAdditionalCosts([]);setImage(null);setEditingId(null);
  };

  const addOrUpdateItem = () => {
    if (!name || !price || !purchaseDate) {
      alert("请填写名称、价格、购买日期");
      return;
    }
    const data = {
      name,price:Number(price),purchaseDate,expireDate,type,category,
      quantity: type==="consume" ? Number(quantity)||null : null,
      usedCount: type==="consume" ? Number(usedCount)||0 : null,
      additionalCosts,image,isFinished:false
    };
    if (editingId) {
      setItems(items.map(i=>i.id===editingId ? {...i,...data} : i));
    } else {
      setItems([...items,{id:Date.now(),...data}]);
    }
    resetForm();
  };

  const startEdit = (item) => {
    setName(item.name);
    setPrice(String(item.price));
    setPurchaseDate(item.purchaseDate);
    setExpireDate(item.expireDate||"");
    setType(item.type);
    setCategory(item.category);
    setQuantity(item.quantity!=null ? String(item.quantity) : "");
    setUsedCount(item.usedCount!=null ? String(item.usedCount) : "");
    setAdditionalCosts(item.additionalCosts||[]);
    setImage(item.image);
    setEditingId(item.id);
  };

  const addAdditionalCost = () => {
    const desc = prompt("描述");
    const amt = prompt("金额");
    if (!desc||!amt||isNaN(Number(amt))) return;
    setAdditionalCosts([...additionalCosts,{desc,amt:Number(amt)}]);
  };

  // ====================== 消耗品功能 ======================
  const handleUseOnce = (id) => {
    setItems(items.map(it=>{
      if (it.id===id && it.type==="consume" && !it.isFinished) {
        return {...it, usedCount:(it.usedCount||0)+1};
      }
      return it;
    }));
  };

  const handleMarkFinished = (id) => {
    if (window.confirm("确定标记为已耗尽？")) {
      setItems(items.map(it=>it.id===id ? {...it,isFinished:true} : it));
    }
  };

  // ====================== 穿搭 ======================
  const saveTodayOutfit = () => {
    if (selectedOutfitItems.length===0) {
      alert("请选择服饰");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const updated = items.map(it=>{
      if (selectedOutfitItems.includes(it.id) && !it.isFinished) {
        return {...it, usedCount:(it.usedCount||0)+1};
      }
      return it;
    });
    setItems(updated);
    const newRec = {date:today, itemIds:selectedOutfitItems};
    setOutfitHistory(prev=>{
      const idx = prev.findIndex(x=>x.date===today);
      if (idx>=0) {
        const copy = [...prev];
        copy[idx]=newRec;
        return copy;
      } else {
        return [newRec,...prev];
      }
    });
    setSelectedOutfitItems([]);
    alert("已保存");
  };

  // ====================== 筛选 ======================
  const filtered = items.filter(i=>
    (filterCategory==="全部" || i.category===filterCategory)
    && i.name.includes(search)
  );

  const grouped = filtered.reduce((g,i)=>{
    if (!g[i.category]) g[i.category]=[];
    g[i.category].push(i);
    return g;
  },{});

  const outfitItems = items.filter(i=>
    i.category==="服饰" && i.type==="consume" && !i.isFinished
  );

  // ====================== 渲染 ======================
  return (
  <div className="min-h-screen bg-gray-50 p-4 max-w-4xl mx-auto">
    <h1 className="text-2xl font-bold mb-4">物品 & 穿搭管理</h1>

    <div className="flex border-b mb-4">
      <button onClick={()=>setActiveTab("items")} className={`px-4 py-2 ${activeTab==="items"?"border-b-2 border-blue-600 font-bold":""}`}>物品管理</button>
      <button onClick={()=>setActiveTab("outfit")} className={`px-4 py-2 ${activeTab==="outfit"?"border-b-2 border-pink-600 font-bold":""}`}>每日穿搭</button>
    </div>

    {activeTab==="items" && (
    <>
      <div className="flex gap-2 mb-4">
        <input placeholder="搜索" value={search} onChange={e=>setSearch(e.target.value)} className="border p-2 rounded flex-1"/>
        <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="border p-2 rounded">
          <option value="全部">全部分类</option>
          {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="font-bold mb-2">{editingId?"编辑物品":"添加物品"}</h3>
        <input placeholder="名称" value={name} onChange={e=>setName(e.target.value)} className="border w-full p-2 rounded mb-2"/>
        <input placeholder="价格" type="number" value={price} onChange={e=>setPrice(e.target.value)} className="border w-full p-2 rounded mb-2"/>
        <input type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} className="border w-full p-2 rounded mb-2"/>
        <select value={type} onChange={e=>setType(e.target.value)} className="border w-full p-2 rounded mb-2">
          <option value="long">长期物品</option>
          <option value="consume">消耗品</option>
        </select>
        <select value={category} onChange={e=>setCategory(e.target.value)} className="border w-full p-2 rounded mb-2">
          {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        {type==="consume" && (
        <>
          <input placeholder="总数量（可选）" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className="border w-full p-2 rounded mb-2"/>
          <input placeholder="已使用次数" type="number" value={usedCount} onChange={e=>setUsedCount(e.target.value)} className="border w-full p-2 rounded mb-2"/>
        </>
        )}
        <button onClick={addAdditionalCost} className="bg-purple-600 text-white p-2 rounded w-full mb-2">添加附加成本</button>
        <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-2"/>
        {ocrLoading && <p className="text-blue-600">识别中...</p>}
        {image && <img src={image} className="w-20 h-20 object-cover rounded mb-2"/>}
        <button onClick={addOrUpdateItem} className="bg-blue-600 text-white p-2 rounded w-full">
          {editingId?"保存修改":"添加物品"}
        </button>
        {editingId && <button onClick={resetForm} className="mt-2 bg-gray-400 text-white p-2 rounded w-full">取消编辑</button>}
      </div>

      {Object.keys(grouped).map(cat=> (
      <div key={cat} className="mb-4">
        <div onClick={()=>toggleCollapse(cat)} className="bg-gray-100 p-3 rounded flex justify-between cursor-pointer">
          <span className="font-bold">{cat}（{grouped[cat].length}）</span>
          <span>{collapsed[cat]?"收起":"展开"}</span>
        </div>
        {!collapsed[cat] && (
        <div className="mt-2 space-y-2">
          {grouped[cat].map(item=>(
          <div key={item.id} className="bg-white p-3 rounded shadow border">
            <div className="flex justify-between">
              <h4 className="font-bold">{item.name}</h4>
              {item.type==="consume" && (
              <span className={`text-xs px-2 py-0.5 rounded ${item.isFinished?"bg-red-100 text-red-700":"bg-green-100 text-green-700"}`}>
                {item.isFinished?"已耗尽":"使用中"}
              </span>
              )}
            </div>
            <p className="text-sm">总价：¥{getTotalCost(item).toFixed(2)}</p>
            {item.type==="long" ? (
            <p className="text-blue-700 font-medium">每日成本：¥{getDayCost(item)}</p>
            ) : (
            <p className="text-green-700 font-medium">单次成本：¥{getUseCost(item)}（已用{item.usedCount||0}次）</p>
            )}
            <div className="mt-2 flex gap-2 flex-wrap">
              {item.type==="consume" && !item.isFinished && (
              <>
                <button onClick={()=>handleUseOnce(item.id)} className="bg-green-500 text-white text-sm px-2 py-1 rounded">使用一次</button>
                <button onClick={()=>handleMarkFinished(item.id)} className="bg-red-500 text-white text-sm px-2 py-1 rounded">标记耗尽</button>
              </>
              )}
              <button onClick={()=>startEdit(item)} className="bg-yellow-400 text-sm px-2 py-1 rounded">编辑</button>
            </div>
          </div>
          ))}
        </div>
        )}
      </div>
      ))}
    </>
    )}

    {activeTab==="outfit" && (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-3">今日穿搭选择</h3>
        <div className="grid grid-cols-2 gap-2">
          {outfitItems.map(it=>(
          <div
          key={it.id}
          onClick={()=>setSelectedOutfitItems(prev=>prev.includes(it.id)?prev.filter(i=>i!==it.id):[...prev,it.id])}
          className={`border p-2 rounded cursor-pointer ${selectedOutfitItems.includes(it.id)?"bg-pink-100 border-pink-400":""}`}
          >
            <p className="font-medium text-sm">{it.name}</p>
            <p className="text-xs text-gray-600">¥{getUseCost(it)}/次</p>
          </div>
          ))}
        </div>
        <button onClick={saveTodayOutfit} className="mt-3 bg-pink-600 text-white p-2 rounded w-full">保存今日穿搭</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">历史穿搭</h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {outfitHistory.map(rec=>{
            const list = items.filter(i=>rec.itemIds.includes(i.id));
            return (
            <div key={rec.date} className="border-b pb-2">
              <p className="font-bold text-sm">{rec.date}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {list.map(i=>(
                <span key={i.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{i.name}</span>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
    )}
  </div>
  );
}