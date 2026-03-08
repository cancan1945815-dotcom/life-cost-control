import { useState, useEffect } from "react";

/*
Life Cost App v1
核心：物品成本管理
*/

export default function App() {

  // =====================
  // 状态
  // =====================

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("life_cost_items");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState("");

  const [type, setType] = useState("long");
  const [category, setCategory] = useState("other");

  const [quantity, setQuantity] = useState("");
  const [image, setImage] = useState(null);

  // =====================
  // 自动保存
  // =====================

  useEffect(() => {
    localStorage.setItem(
      "life_cost_items",
      JSON.stringify(items)
    );
  }, [items]);

  // =====================
  // 图片上传
  // =====================

  const handleImageUpload = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImage(url);
  };

  // =====================
  // 添加物品
  // =====================

  const addItem = () => {

    if (!name || !price || !date) {
      alert("请填写完整信息");
      return;
    }

    const item = {
      id: Date.now(),
      name,
      price: Number(price),
      date,
      type,
      category,
      quantity: type === "consume" ? Number(quantity) : null,
      remain: type === "consume" ? Number(quantity) : null,
      image
    };

    setItems([...items, item]);

    setName("");
    setPrice("");
    setDate("");
    setQuantity("");
    setImage(null);
  };

  // =====================
  // 成本计算
  // =====================

  const getDailyCost = (item) => {

    const buy = new Date(item.date);
    const today = new Date();

    const days =
      Math.floor((today - buy) / (1000 * 60 * 60 * 24)) + 1;

    return (item.price / days).toFixed(2);
  };

  const getUseCost = (item) => {
    if (!item.quantity) return "0";
    return (item.price / item.quantity).toFixed(2);
  };

  // =====================
  // 使用一次
  // =====================

  const useItem = (index) => {

    const newItems = [...items];

    if (newItems[index].remain > 0) {
      newItems[index].remain -= 1;
    }

    setItems(newItems);
  };

  return (

    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-3xl font-bold mb-6">
        Life Cost App
      </h1>

      {/* ========= 添加物品 ========= */}

      <div className="bg-white p-6 rounded-xl shadow mb-8 space-y-3">

        <h2 className="text-xl font-semibold">
          添加物品
        </h2>

        <input
          className="border p-2 w-full rounded"
          placeholder="物品名称"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <input
          className="border p-2 w-full rounded"
          placeholder="价格"
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />

        <input
          className="border p-2 w-full rounded"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        <select
          className="border p-2 w-full rounded"
          value={type}
          onChange={e => setType(e.target.value)}
        >
          <option value="long">长期物品</option>
          <option value="consume">消耗品</option>
        </select>

        <select
          className="border p-2 w-full rounded"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="other">其他</option>
          <option value="clothing">衣物</option>
          <option value="electronics">电子产品</option>
          <option value="daily">日用品</option>
        </select>

        {type === "consume" && (
          <input
            className="border p-2 w-full rounded"
            placeholder="数量"
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />

        {image && (
          <img
            src={image}
            className="w-32 h-32 object-cover rounded"
          />
        )}

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
          onClick={addItem}
        >
          添加物品
        </button>

      </div>

      {/* ========= 物品列表 ========= */}

      <h2 className="text-xl font-semibold mb-4">
        我的物品
      </h2>

      {items.map((item, index) => (

        <div
          key={item.id}
          className="bg-white p-4 rounded shadow mb-4 space-y-2"
        >

          {item.image && (
            <img
              src={item.image}
              className="w-40 h-40 object-cover rounded"
            />
          )}

          <p className="font-bold text-lg">
            {item.name}
          </p>

          <p>价格：{item.price}</p>

          <p>购买时间：{item.date}</p>

          <p>
            分类：
            {item.category}
          </p>

          {item.type === "long" && (
            <p className="text-green-600">
              每日成本：{getDailyCost(item)}
            </p>
          )}

          {item.type === "consume" && (
            <div className="space-y-1">
              <p>剩余：{item.remain}</p>
              <p>每次成本：{getUseCost(item)}</p>

              <button
                className="bg-green-500 text-white px-3 py-1 rounded"
                onClick={() => useItem(index)}
              >
                使用一次
              </button>
            </div>
          )}

        </div>
      ))}

    </div>
  );
}