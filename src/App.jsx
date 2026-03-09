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
  const [type, setType] = useState("long");
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

  // 本地保存
  useEffect(() => {
    localStorage.setItem("life_cost_items", JSON.stringify(items));
  }, [items]);

  const typeCategories = ["电子产品", "服饰", "食品", "日用品", "其他", ...Array.from(new Set(items.map(i => i.category)))];

  const toggleCollapse = (cat) => {
    setCollapsed({ ...collapsed, [cat]: !collapsed[cat] });
  };

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

  // ====================== 已包含附加成本的每日/单次成本 ======================
  const getTotalCost = (item) => {
    const basePrice = item.price || 0;
    const extraCost = (item.additionalCosts || []).reduce((sum, curr) => sum + (curr.amt || 0), 0);
    return basePrice + extraCost;
  };

  // 长期物品：每日成本（总价+附加成本 ÷ 天数）
  const getDayCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    const buy = new Date(item.purchaseDate);
    const now = new Date();
    const diffTime = now - buy;
    const days = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    const total = getTotalCost(item);
    return (total / days).toFixed(2);
  };

  // 消耗品：单次成本（总价+附加成本 ÷ 次数）
  const getUseCost = (item) => {
    if (item.type !== "consume") return "0.00";
    const totalCount = item.usedCount || 1;
    const total = getTotalCost(item);
    return (total / totalCount).toFixed(2);
  };
  // ========================================================================

  const activeItems = items.filter(i=>!i.inTrash).filter(i=>filterCategory==="全部"||i.category===filterCategory);
  const trashItems = items.filter(i=>i.inTrash);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">米米去处</h1>

      <div className="flex gap-2 mb-4">
        <input className="border p-2 w-full rounded" placeholder="搜索名称" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="border p-2 rounded" value={filterCategory} onChange={e=>setFilterCategory(e.value)}>
          {typeCategories.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white p-5 rounded-xl shadow mb-6 space-y-3">
        <h2 className="text-xl font-semibold">{editingId ? "编辑物品" : "添加物品"}</h2>
        {editingId && <button onClick={resetForm} className="bg-gray-400 text-white p-2 rounded w-full">取消编辑</button>}

        <input className="border p-2 w-full rounded" placeholder="名称" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2 w-full rounded" placeholder="价格" type="number" value={price} onChange={e=>setPrice(e.target.value)} />

        <label className="block font-semibold">购买日期</label>
        <input className="border p-2 w-full rounded" type="date" placeholder="请选择购买日期" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)} />

        <label className="block font-semibold mt-2">到期日期（可选）</label>
        <input className="border p-2 w-full rounded" type="date" placeholder="请选择到期日期" value={expireDate} onChange={e=>setExpireDate(e.target.value)} />

        <select className="border p-2 w-full rounded" value={type} onChange={e=>setType(e.target.value)}>
          <option value="long">长期物品</option>
          <option value="consume">消耗品</option>
        </select>

        <select className="border p-2 w-full rounded" value={category} onChange={e=>setCategory(e.target.value)}>
          {typeCategories.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="自定义">自定义</option>
        </select>
        {category==="自定义" && <input className="border p-2 w-full rounded mt-1" placeholder="请输入自定义分类" onChange={e=>setCategory(e.target.value)} />}

        {type==="consume" && <>
          <input className="border p-2 w-full rounded" placeholder="总数量（可选）" type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} />
          <input className="border p-2 w-full rounded" placeholder="已使用次数（可选）" type="number" value={usedCount} onChange={e=>setUsedCount(e.target.value)} />
        </>}

        <button onClick={addAdditionalCost} className="bg-purple-500 text-white p-2 rounded w-full">添加附加成本</button>

        <input type="file" accept="image/*" onChange={handleImageUpload}/>
        {ocrLoading && <p className="text-blue-500">识别中...</p>}
        {image && <div className="flex items-center gap-2 mt-2"><img src={image} className="w-24 h-24 object-cover rounded"/><button onClick={removeImage} className="bg-red-500 text-white px-2 py-1 rounded">删除图片</button></div>}

        <button onClick={addOrUpdateItem} className="bg-blue-500 text-white p-2 rounded w-full">{editingId?"保存修改":"添加物品"}</button>
      </div>

      {/* 分类折叠显示 */}
      {typeCategories.filter(c=>"全部"!==c).map(cat => {
        const catItems = activeItems.filter(i=>i.category===cat);
        if(catItems.length===0) return null;
        return (
          <div key={cat} className="mb-3">
            <div className="bg-gray-200 p-2 rounded flex justify-between cursor-pointer" onClick={()=>toggleCollapse(cat)}>
              <span>{cat} ({catItems.length})</span>
              <span>{collapsed[cat]?"▲":"▼"}</span>
            </div>
            {!collapsed[cat] && catItems.map(item => (
              <div key={item.id} className="bg-white p-4 rounded shadow mt-1">
                {item.image && <img src={item.image} className="w-32 h-32 object-cover rounded mb-2" />}
                <p className="font-bold">{item.name}</p>
                <p>价格：{item.price}</p>
                <p>购买日期：{item.purchaseDate}</p>

                {/* ====================== 自动显示：含附加成本的每日/单次成本 ====================== */}
                {item.type === "long" && (
                  <p className="text-green-700 font-medium">
                    每日成本（含附加）：¥{getDayCost(item)}
                  </p>
                )}
                {item.type === "consume" && (
                  <p className="text-blue-700 font-medium">
                    单次成本（含附加）：¥{getUseCost(item)}
                  </p>
                )}
                {/* ============================================================================== */}

                {item.expireDate && <p>到期日期：{item.expireDate}</p>}
                {item.type==="consume" && <p>已使用次数：{item.usedCount} / {item.quantity}</p>}
                {item.additionalCosts && item.additionalCosts.length>0 && (
                  <div className="mt-1">
                    <p className="font-semibold">附加成本：</p>
                    {item.additionalCosts.map((a,i)=><p key={i}>{a.desc}: {a.amt}</p>)}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button onClick={()=>startEdit(item)} className="bg-yellow-400 px-3 py-1 rounded">编辑</button>
                  <button onClick={()=>setItems(items.filter(i=>i.id!==item.id))} className="bg-red-500 text-white px-3 py-1 rounded">删除</button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}