import React, { useState, useEffect } from "react";

const ItemForm = ({
  item,
  categories,
  onSubmit,
  recentCategory,
  lastAlbumPath,
  onAlbumPathChange
}) => {
  const isEdit = !!item;
  const [formData, setFormData] = useState({
    id: item?.id || Date.now(),
    name: item?.name || "",
    category: item?.category || recentCategory || "服饰",
    price: item?.price || "",
    purchaseDate: item?.purchaseDate || new Date().toISOString().split("T")[0],
    type: item?.type || "consume", // consume 消耗品 / durable 非消耗品
    usedCount: item?.usedCount || 0,
    isFinished: item?.isFinished || false,
    image: item?.image || null,
    note: item?.note || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData(prev => ({ ...prev, image: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, formData.category);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品名称 *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
        <input
          type="number"
          step="0.01"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
        <input
          type="date"
          name="purchaseDate"
          value={formData.purchaseDate}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品类型</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="consume">消耗品（可计数）</option>
          <option value="durable">非消耗品（按天折旧）</option>
        </select>
      </div>

      {formData.type === "consume" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">已使用次数</label>
          <input
            type="number"
            min="0"
            name="usedCount"
            value={formData.usedCount}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品图片</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        {formData.image && (
          <img
            src={formData.image}
            alt="预览"
            className="mt-2 max-h-32 rounded-md border object-contain"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        {isEdit ? "保存修改" : "添加物品"}
      </button>
    </form>
  );
};

export default ItemForm;