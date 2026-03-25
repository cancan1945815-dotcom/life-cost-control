import React, { useState, useEffect } from "react";

const ItemForm = ({
  item,
  categories,
  onSubmit,
  recentCategory,
  lastAlbumPath,
  onAlbumPathChange
}) => {
  const [formData, setFormData] = useState({
    name: "",
    category: recentCategory || "服饰",
    type: "consume",
    price: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    brand: "",
    spec: "",
    note: "",
    image: null,
    usedCount: 0,
    isFinished: false,
    ...item
  });

  const [customCategory, setCustomCategory] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = isCustom ? customCategory : formData.category;
    if (!finalCategory) return;

    const submitData = {
      ...formData,
      id: formData.id || Date.now(),
      category: finalCategory
    };

    onSubmit(submitData, finalCategory);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 物品名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            物品名称 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>

        {/* 价格 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            价格 *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>

        {/* 分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分类
          </label>
          <div className="flex gap-2">
            <select
              value={isCustom ? "" : formData.category}
              onChange={(e) => {
                setIsCustom(false);
                handleChange(e);
              }}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setIsCustom(!isCustom)}
              className="px-3 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              自定义
            </button>
          </div>

          {isCustom && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="输入新分类名称"
              className="mt-2 w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
            />
          )}
        </div>

        {/* 物品类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            物品类型
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          >
            <option value="consume">消耗品</option>
            <option value="non-consume">非消耗品</option>
          </select>
        </div>

        {/* 购买日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            购买日期
          </label>
          <input
            type="date"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>

        {/* 品牌 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            品牌
          </label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>

        {/* 规格 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            规格
          </label>
          <input
            type="text"
            name="spec"
            value={formData.spec}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* 备注 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          备注
        </label>
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent resize-none"
        />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {item ? "保存修改" : "添加物品"}
        </button>
      </div>
    </form>
  );
};

export default ItemForm;