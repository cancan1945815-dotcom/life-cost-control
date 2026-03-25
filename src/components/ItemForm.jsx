import React, { useState, useEffect } from "react";

const ItemForm = ({
  item,
  categories,
  onSubmit,
  recentCategory,
}) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    id: item?.id || Date.now(),
    name: item?.name || "",
    category: item?.category || recentCategory || "服饰",
    price: item?.price || "",
    type: item?.type || "consume",
    usedCount: item?.usedCount || 0,
    isFinished: item?.isFinished || false,
    note: item?.note || "",
    image: item?.image || null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, form.category);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
        <input
          required
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select
          required
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">单价</label>
        <input
          required
          type="number"
          step="0.01"
          name="price"
          value={form.price}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品类型</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        >
          <option value="consume">消耗品</option>
          <option value="permanent">非消耗品</option>
        </select>
      </div>

      {form.type === "consume" && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">已使用次数</label>
            <input
              type="number"
              min="0"
              name="usedCount"
              value={form.usedCount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center">
            <label className="text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                name="isFinished"
                checked={form.isFinished}
                onChange={(e) => setForm((prev) => ({ ...prev, isFinished: e.target.checked }))}
                className="mr-1"
              />
              已耗尽
            </label>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
        <input type="file" accept="image/*" onChange={handleImage} className="w-full" />
        {form.image && (
          <img src={form.image} alt="" className="mt-2 h-20 object-cover rounded border" />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          name="note"
          value={form.note}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          rows="2"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {isEdit ? "保存修改" : "添加物品"}
      </button>
    </form>
  );
};

export default ItemForm;