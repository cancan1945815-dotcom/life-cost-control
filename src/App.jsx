import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("life_cost_items");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState("其他");
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [image, setImage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("全部");

  const [collapsedCategories, setCollapsedCategories] = useState({});

  useEffect(() => {
    localStorage.setItem("life_cost_items", JSON.stringify(items));
  }, [items]);

  // 图片 OCR 预处理
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
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
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
          const m =
            line.match(/\d{4}-\d{2}-\d{2}/) ||
            line.match(/\d{2}\/\d{2}\/\d{4}/);
          if (m) {
            detectedDate = m[0];
            if (detectedDate.includes("/")) {
              const [mm, dd, yyyy] = detectedDate.split("/");
              detectedDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(
                2,
                "0"
              )}`;
            }
            break;
          }
        }

        if (detectedName) setName(detectedName);
        if (detectedPrice) setPrice(detectedPrice);
        if (detectedDate) setDate(detectedDate);
      })
      .finally(() => setOcrLoading(false));
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setDate("");
    setExpireDate("");
    setType("long");
    setCategory("其他");
    setQuantity("");
    setUsedCount("");
    setImage(null);
    setEditingId(null);
  };

  const addOrUpdateItem = () => {
    if (!name || !price || !date) {
      alert("请填写名称、价格和购买日期");
      return;
    }
    if (type === "consume" && !quantity && !usedCount) {
      alert("消耗品请填写数量或已使用次数");
      return;
    }

    const common = {
      name,
      price: Number(price),
      date,
      expireDate: expireDate || null,
      type,
      category: category || "其他",
      image: image || undefined,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      inTrash: false,
    };

    if (editingId) {
      setItems(
        items.map((item) =>
          item.id !== editingId ? item : { ...item, ...common }
        )
      );
    } else {
      const newItem = { id: Date.now(), ...common };
      setItems([...items, newItem]);
    }

    resetForm();
  };

  const startEdit = (item) => {
    setName(item.name);
    setPrice(String(item.price));
    setDate(item.date);
    setExpireDate(item.expireDate || "");
    setType(item.type);
    setCategory(item.category);
    setQuantity(item.quantity != null ? String(item.quantity) : "");
    setUsedCount(item.usedCount != null ? String(item.usedCount) : "");
    setImage(item.image);
    setEditingId(item.id);
  };

  const moveToTrash = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, inTrash: true } : i)));
  const restoreItem = (id) =>
    setItems(items.map((i) => (i.id === id ? { ...i, inTrash: false } : i)));
  const deleteItem = (id) =>
    window.confirm("确定永久删除？") &&
    setItems(items.filter((i) => i.id !== id));
  const removeImage = (id = null) =>
    id
      ? setItems(items.map((i) => (i.id === id ? { ...i, image: null } : i)))
      : setImage(null);

  const useOnce = (id) => {
    setItems(
      items.map((i) => {
        if (i.id !== id) return i;
        if (i.type === "consume") {
          const remain = i.quantity != null ? i.quantity - (i.usedCount || 0) : null;
          return { ...i, usedCount: (i.usedCount || 0) + 1, remain: remain != null ? remain - 1 : null };
        }
        return i;
      })
    );
  };

  const dailyCost = (i) => {
    const days = Math.ceil((new Date() - new Date(i.date)) / (1000 * 60 * 60 * 24)) || 1;
    return (i.price / days).toFixed(2);
  };
  const onceCost = (i) => {
    if (!i.usedCount || i.usedCount === 0) return "0.00";
    return (i.price / i.usedCount).toFixed(2);
  };

  const activeItems = items
    .filter((i) => !i.inTrash)
    .filter((i) => i.name.includes(search))
    .filter((i) => filterType === "全部" || i.category === filterType);

  const trashItems = items.filter((i) => i.inTrash);
  const types = ["全部", ...new Set(items.map((i) => i.category))];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    performOCR(file);
  };

  const toggleCategory = (cat) => {
    setCollapsedCategories({
      ...collapsedCategories,
      [cat]: !collapsedCategories[cat],
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">米米去处</h1>

      {/* 搜索和类型筛选 */}
      <div className="flex gap-2 mb-4">
        <input className="border p-2 w-full rounded flex-1" placeholder="搜索名称" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="border p-2 rounded" value={filterType} onChange={e=>setFilterType(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* 表单 */}
      <div className="bg-white p-5 rounded-xl shadow mb-6 space-y-3">
        <h2 className="text-xl font-semibold">{editingId ? "编辑物品" : "添加物品"}</h2>
        {editingId && <button onClick={resetForm} className="bg-gray-400 text-white p-2 rounded w-full">取消编辑</button>}
        <input className="border p-2 w-full rounded" placeholder="名称" value={name} onChange={e => setName(e.target.value)} />
        <input className="border p-2 w-full rounded" placeholder="价格" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm mb-1">购买日期</label>
          <input className="border p-2 w-full rounded" type="date" placeholder="请选择购买日期" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-500 text-sm mb-1">到期时间（可选）</label>
          <input className="border p-2 w-full rounded" type="date" placeholder="请选择到期时间" value={expireDate} onChange={e => setExpireDate(e.target.value)} />
        </div>
        <select className="border p-2 w-full rounded" value={type} onChange={e => setType(e.target.value)}>
          <option value="long">长期物品</option>
          <option value="consume">消耗品</option>
        </select>
        <input className="border p-2 w-full rounded" placeholder="物品类型（可自定义）" value={category} onChange={e=>setCategory(e.target.value)} />
        {type === "consume" && <>
          <input className="border p-2 w-full rounded" placeholder="总数量（可选）" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
          <input className="border p-2 w-full rounded" placeholder="已使用次数（可选）" type="number" value={usedCount} onChange={e => setUsedCount(e.target.value)} />
        </>}
        <input type="file" accept="image/*" onChange={handleImageUpload}/>
        {ocrLoading && <p className="text-blue-500">识别中...</p>}
        {image && <div className="flex items-center gap-2 mt-2"><img src={image} className="w-24 h-24 object-cover rounded"/><button onClick={()=>removeImage()} className="bg-red-500 text-white px-2 py-1 rounded">删除图片</button></div>}
        <button onClick={addOrUpdateItem} className="bg-blue-500 text-white p-2 rounded w-full">{editingId ? "保存修改" : "添加物品"}</button>
      </div>

      {/* 活动物品列表（折叠分类） */}
      {types.filter(t=>"全部"!==t).map(t=>{
        const typeItems = activeItems.filter(i=>i.category===t);
        if(typeItems.length===0) return null;
        const collapsed = collapsedCategories[t];
        return (
          <div key={t}>
            <h2 className="text-xl font-semibold mt-4 mb-2 flex items-center justify-between cursor-pointer" onClick={()=>toggleCategory(t)}>
              {t} ({typeItems.length}) 
              <span className="text-gray-500">{collapsed ? "▼" : "▲"}</span>
            </h2>
            {!collapsed && typeItems.map(item=>(
              <div key={item.id} className="bg-white p-4 rounded shadow mb-3">
                {item.image && <div className="flex items-center gap-2 mb-2"><img src={item.image} className="w-32 h-32 object-cover rounded"/><button onClick={()=>removeImage(item.id)} className="bg-red-500 text-white px-2 py-1 rounded">删除图片</button></div>}
                <p className="font-bold flex items-center">
                  {item.name} 
                  {item.expireDate && new Date(item.expireDate) <= new Date() && (
                    <span className="ml-2 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </p>
                <p>价格：{item.price}</p>
                <p>购买日期：{item.date}</p>
                {item.expireDate && <p>到期时间：{item.expireDate}</p>}
                {item.type==="long" && <p className="text-green-600">每日成本：{dailyCost(item)}</p>}
                {item.type==="consume" && <>
                  <p>已使用次数：{item.usedCount}</p>
                  {item.quantity!=null && <p>剩余：{item.quantity-item.usedCount}</p>}
                  <p>平均一次成本：{onceCost(item)}</p>
                  <button onClick={()=>useOnce(item.id)} className="bg-green-500 text-white px-2 py-1 rounded mt-1">使用一次</button>
                </>}
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>startEdit(item)} className="bg-yellow-400 px-3 py-1 rounded">编辑</button>
                  <button onClick={()=>moveToTrash(item.id)} className="bg-red-500 text-white px-3 py-1 rounded">删除</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* 垃圾箱 */}
      <h2 className="text-xl font-semibold mt-6 mb-3">垃圾箱</h2>
      {trashItems.length===0?<p className="text-gray-500">垃圾箱为空</p>:trashItems.map(item=>(
        <div key={item.id} className="bg-white p-4 rounded shadow mb-3">
          {item.image && <div className="flex items-center gap-2 mb-2"><img src={item.image} className="w-32 h-32 object-cover rounded"/><button onClick={()=>removeImage(item.id)} className="bg-red-500 text-white px-2 py-1 rounded">删除图片</button></div>}
          <p className="font-bold">{item.name}</p>
          <p>价格：{item.price}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={()=>restoreItem(item.id)} className="bg-blue-500 text-white px-3 py-1 rounded">恢复</button>
            <button onClick={()=>deleteItem(item.id)} className="bg-red-700 text-white px-3 py-1 rounded">永久删除</button>
          </div>
        </div>
      ))}
    </div>
  );
}
