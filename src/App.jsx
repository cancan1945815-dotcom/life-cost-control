import React, { useState, useEffect } from "react";

export default function App() {
  const [page, setPage] = useState("items"); 
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("life_cost_items");
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem("life_cost_categories");
    return saved ? JSON.parse(saved) : ["其他", "食品", "衣物", "电子"];
  });

  useEffect(() => localStorage.setItem("life_cost_items", JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem("life_cost_categories", JSON.stringify(categories)), [categories]);

  // 表单状态
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState(categories[0]);
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [collapsed, setCollapsed] = useState({});

  const [outfits, setOutfits] = useState(() => {
    const saved = localStorage.getItem("daily_outfits");
    return saved ? JSON.parse(saved) : {};
  });
  const today = new Date().toISOString().slice(0, 10);
  const todayOutfit = outfits[today] || [];

  const resetForm = () => {
    setName(""); setPrice(""); setPurchaseDate(""); setExpireDate("");
    setType("long"); setCategory(categories[0]); setQuantity(""); setUsedCount("");
    setImage(null); setEditingId(null);
  };

  const addOrUpdateItem = () => {
    if (!name || !price || !purchaseDate) return alert("请填写名称、价格和购买日期");
    const common = {
      name,
      price: Number(price),
      purchaseDate,
      expireDate,
      type,
      category,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      image: image || undefined,
      inTrash: false,
    };
    if (!categories.includes(category)) setCategories([...categories, category]);

    if (editingId) {
      setItems(items.map(i => i.id === editingId ? { ...i, ...common } : i));
    } else {
      setItems([...items, { id: Date.now(), ...common }]);
    }
    resetForm();
  };

  const startEdit = (item) => {
    setName(item.name); setPrice(String(item.price)); setPurchaseDate(item.purchaseDate);
    setExpireDate(item.expireDate); setType(item.type); setCategory(item.category);
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUsedCount(item.usedCount != null ? String(item.usedCount) : "");
    setImage(item.image); setEditingId(item.id);
  };

  const toggleCollapse = (cat) => setCollapsed({...collapsed, [cat]: !collapsed[cat]});

  const toggleOutfitItem = (id) => {
    let updated = [...todayOutfit];
    if (todayOutfit.includes(id)) updated = updated.filter(i => i !== id);
    else updated.push(id);
    const newOutfits = { ...outfits, [today]: updated };
    setOutfits(newOutfits);
    localStorage.setItem("daily_outfits", JSON.stringify(newOutfits));
  };

  const activeItems = items.filter(i => !i.inTrash);
  const typeCategories = [...new Set(items.map(i => i.category))];

  // ---------------- 到期提醒计算 ----------------
  const getExpireStatus = (expire) => {
    if (!expire) return null;
    const todayDate = new Date();
    const expireDateObj = new Date(expire);
    const diffDays = Math.ceil((expireDateObj - todayDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return "⚠️ 已到期";
    if (diffDays <= 3) return "⏳ 即将到期";
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">米米去处</h1>

      <div className="flex gap-2 mb-4">
        <button className={page==="items"?"bg-blue-500 text-white":"bg-gray-200"} onClick={()=>setPage("items")}>物品管理</button>
        <button className={page==="outfits"?"bg-blue-500 text-white":"bg-gray-200"} onClick={()=>setPage("outfits")}>每日穿搭</button>
      </div>

      {page==="items" && (
        <div>
          {/* 表单 */}
          <div className="bg-white p-5 rounded-xl shadow mb-6 space-y-3">
            <h2 className="text-xl font-semibold">{editingId?"编辑物品":"添加物品"}</h2>
            {editingId && <button onClick={resetForm} className="bg-gray-400 text-white p-2 rounded w-full">取消编辑</button>}
            <input className="border p-2 w-full rounded" placeholder="名称" value={name} onChange={e=>setName(e.target.value)} />
            <input className="border p-2 w-full rounded" placeholder="价格" type="number" value={price} onChange={e=>setPrice(e.target.value)} />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium">购买日期</label>
                <input className="border p-2 w-full rounded" type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium">到期日期（可选）</label>
                <input className="border p-2 w-full rounded" type="date" value={expireDate} onChange={e=>setExpireDate(e.target.value)} />
              </div>
            </div>
            <select className="border p-2 w-full rounded" value={type} onChange={e=>setType(e.target.value)}>
              <option value="long">长期物品</option>
              <option value="consume">消耗品</option>
            </select>
            <input className="border p-2 w-full rounded" placeholder="物品类型（可自定义）" value={category} onChange={e=>setCategory(e.target.value)} />
            {type==="consume" && <>
              <input className="border p-2 w-full rounded" placeholder="总数量（可选）" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} />
              <input className="border p-2 w-full rounded" placeholder="已使用次数（可选）" type="number" value={usedCount} onChange={e=>setUsedCount(e.target.value)} />
            </>}
            <button onClick={addOrUpdateItem} className="bg-blue-500 text-white p-2 rounded w-full">{editingId?"保存修改":"添加物品"}</button>
          </div>

          {/* 分类列表 */}
          {typeCategories.map(cat => {
            const catItems = activeItems.filter(i=>i.category===cat);
            if(catItems.length===0) return null;
            return (
              <div key={cat} className="mb-3">
                <div className="bg-gray-200 p-2 rounded flex justify-between cursor-pointer" onClick={()=>toggleCollapse(cat)}>
                  <span>{cat} ({catItems.length})</span>
                  <span>{collapsed[cat]?"▲":"▼"}</span>
                </div>
                {!collapsed[cat] && catItems.map(item => {
                  const expireStatus = getExpireStatus(item.expireDate);
                  return (
                    <div key={item.id} className="bg-white p-4 rounded shadow mt-1">
                      <p className="font-bold">{item.name} {expireStatus && <span className="text-red-600">{expireStatus}</span>}</p>
                      <p>价格：{item.price}</p>
                      <p>购买日期：{item.purchaseDate}</p>
                      {item.expireDate && <p>到期日期：{item.expireDate}</p>}
                      {item.type==="consume" && <p>已使用次数：{item.usedCount} / {item.quantity}</p>}
                      <div className="flex gap-2 mt-2">
                        <button onClick={()=>startEdit(item)} className="bg-yellow-400 px-3 py-1 rounded">编辑</button>
                        <button onClick={()=>setItems(items.filter(i=>i.id!==item.id))} className="bg-red-500 text-white px-3 py-1 rounded">删除</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {page==="outfits" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">选择今日穿搭</h2>
          <div className="grid grid-cols-2 gap-3">
            {activeItems.map(item => (
              <div key={item.id} className={`p-3 rounded border cursor-pointer ${todayOutfit.includes(item.id) ? "bg-green-200 border-green-400" : "bg-white border-gray-300"}`} onClick={()=>toggleOutfitItem(item.id)}>
                <p className="font-bold">{item.name}</p>
                <p className="text-sm text-gray-500">{item.category}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
