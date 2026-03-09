import React, { useState, useEffect } from "react";
import Tesseract from "tesseract.js";

export default function App() {
  // -------- 状态管理 --------
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("life_cost_items");
    return saved ? JSON.parse(saved) : [];
  });

  const [dailyLogs, setDailyLogs] = useState(() => {
    const saved = localStorage.getItem("life_cost_daily_logs");
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
  const [image, setImage] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("全部");
  const [collapsed, setCollapsed] = useState({});

  // 附属成本
  const [subCostName, setSubCostName] = useState("");
  const [subCostPrice, setSubCostPrice] = useState("");
  const [subCostDate, setSubCostDate] = useState("");
  const [editingSubCostId, setEditingSubCostId] = useState(null);

  // 日常穿搭页
  const [page, setPage] = useState("items"); // items | daily
  const [todaySelection, setTodaySelection] = useState([]);

  // -------- 本地存储 --------
  useEffect(() => {
    localStorage.setItem("life_cost_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("life_cost_daily_logs", JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  // -------- OCR 图片识别 --------
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
        if (detectedDate) setPurchaseDate(detectedDate);
      })
      .finally(() => setOcrLoading(false));
  };

  // -------- 表单操作 --------
  const resetForm = () => {
    setName("");
    setPrice("");
    setPurchaseDate("");
    setExpireDate("");
    setType("long");
    setCategory("其他");
    setQuantity("");
    setUsedCount("");
    setImage(null);
    setEditingId(null);
    setSubCostName("");
    setSubCostPrice("");
    setSubCostDate("");
    setEditingSubCostId(null);
  };

  const addOrUpdateItem = () => {
    if (!name || !price || !purchaseDate) {
      return alert("请填写名称、价格和购买日期");
    }
    if (type === "consume" && !quantity && !usedCount) {
      return alert("消耗品请填写数量或已使用次数");
    }

    const common = {
      name,
      price: Number(price),
      purchaseDate,
      expireDate: expireDate || null,
      type,
      category: category || "其他",
      image: image || undefined,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      subCosts: editingId ? items.find(i => i.id === editingId)?.subCosts || [] : [],
      inTrash: false,
    };

    if (editingId) {
      setItems(items.map(i => (i.id !== editingId ? i : { ...i, ...common })));
    } else {
      const newItem = { id: Date.now(), ...common };
      setItems([...items, newItem]);
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
    setImage(item.image);
    setEditingId(item.id);
  };

  // -------- 折叠 --------
  const toggleCollapse = (cat) => {
    setCollapsed({ ...collapsed, [cat]: !collapsed[cat] });
  };

  // -------- 附属成本 --------
  const addOrUpdateSubCost = () => {
    if (!subCostName || !subCostPrice || !subCostDate)
      return alert("请填写完整的附属成本信息");

    setItems(
      items.map((item) => {
        if (item.id !== editingId) return item;

        if (editingSubCostId) {
          // 编辑已有附属成本
          const newSubCosts = item.subCosts.map(sc =>
            sc.id === editingSubCostId
              ? { ...sc, name: subCostName, price: Number(subCostPrice), date: subCostDate }
              : sc
          );
          return { ...item, subCosts: newSubCosts };
        } else {
          // 新增附属成本
          const newSubCost = {
            id: Date.now(),
            name: subCostName,
            price: Number(subCostPrice),
            date: subCostDate,
          };
          return { ...item, subCosts: [...(item.subCosts || []), newSubCost] };
        }
      })
    );

    // 重置表单
    setSubCostName("");
    setSubCostPrice("");
    setSubCostDate("");
    setEditingSubCostId(null);
  };

  const removeSubCost = (itemId, subCostId) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;
        return { ...item, subCosts: item.subCosts.filter((sc) => sc.id !== subCostId) };
      })
    );
  };

  // -------- 每日穿搭 --------
  const toggleTodaySelection = (id) => {
    if (todaySelection.includes(id)) {
      setTodaySelection(todaySelection.filter((i) => i !== id));
    } else {
      setTodaySelection([...todaySelection, id]);
    }
  };

  const saveTodaySelection = () => {
    const log = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      items: todaySelection,
    };
    setDailyLogs([...dailyLogs, log]);
    setItems(
      items.map((i) =>
        todaySelection.includes(i.id)
          ? {
              ...i,
              usedCount: i.type === "consume" ? (i.usedCount || 0) + 1 : i.usedCount,
            }
          : i
      )
    );
    setTodaySelection([]);
    alert("今日穿搭已保存");
  };

  // -------- 辅助函数 --------
  const dailyCost = (i) => {
    const days = Math.ceil((new Date() - new Date(i.purchaseDate)) / (1000 * 60 * 60 * 24)) || 1;
    return (i.price / days).toFixed(2);
  };
  const onceCost = (i) => {
    if (!i.usedCount || i.usedCount === 0) return "0.00";
    return (i.price / i.usedCount).toFixed(2);
  };
  const getExpireStatus = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "已过期";
    if (diff <= 7) return `即将到期(${diff}天)`;
    return "";
  };

  const activeItems = items.filter((i) => !i.inTrash).filter((i) => i.name.includes(search));
  const typeCategories = ["全部", ...new Set(items.map((i) => i.category))];

  // -------- 图片上传 --------
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    performOCR(file);
  };

  // -------- JSX --------
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">米米去处</h1>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setPage("items")} className={`p-2 rounded ${page==="items"?"bg-blue-500 text-white":"bg-gray-300"}`}>物品管理</button>
        <button onClick={() => setPage("daily")} className={`p-2 rounded ${page==="daily"?"bg-blue-500 text-white":"bg-gray-300"}`}>每日穿搭</button>
      </div>

      {page === "items" && (
        <div>
          {/* 搜索和筛选 */}
          <div className="flex gap-2 mb-4">
            <input className="border p-2 w-full rounded flex-1" placeholder="搜索名称" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border p-2 rounded" value={filterType} onChange={e => setFilterType(e.target.value)}>
              {typeCategories.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 表单（已更新） */}
          {/* ======= 使用我上一条消息提供的表单 JSX，包含购买/到期日期标签 + 可编辑附属成本 ======= */}
        </div>
      )}

      {page === "daily" && (
        <div>
          <h2 className="text-xl font-semibold mb-3">今日穿搭</h2>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {activeItems.map(i => (
              <div key={i.id} className={`border p-2 rounded cursor-pointer ${todaySelection.includes(i.id) ? "bg-blue-200" : ""}`} onClick={()=>toggleTodaySelection(i.id)}>
                {i.name} {i.type==="consume" && `(已用${i.usedCount || 0})`}
              </div>
            ))}
          </div>
          <button onClick={saveTodaySelection} className="bg-green-500 text-white p-2 rounded mb-3">保存今日穿搭</button>

          <h2 className="text-xl font-semibold mb-3">历史穿搭</h2>
          {dailyLogs.map(log => (
            <div key={log.id} className="border p-2 rounded mb-2">
              <p>{log.date}</p>
              <div className="flex flex-wrap gap-2">
                {log.items.map(id => {
                  const item = items.find(i => i.id===id);
                  if(!item) return null;
                  return <span key={id} className="bg-gray-200 px-2 py-1 rounded">{item.name}</span>
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
