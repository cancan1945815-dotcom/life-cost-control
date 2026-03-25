import React, { useState, useEffect } from 'react';

const ItemForm = ({ 
  item, 
  categories, 
  onSubmit, 
  recentCategory,
  lastAlbumPath,
  onAlbumPathChange
}) => {
  const [formData, setFormData] = useState({
    id: Date.now(),
    name: '',
    category: recentCategory || '服饰',
    price: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    type: 'non-consume', // 非消耗品默认
    usedCount: 0,
    isFinished: false,
    image: null,
    ...item
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, image: event.target.result }));
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
        <label className="block text-sm font-medium text-gray-700 mb-1">物品名称</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物品类型</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="non-consume">非消耗品（显示每日成本）</option>
          <option value="consume">消耗品（显示单次成本）</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          step="0.01"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">购买日期</label>
        <input
          type="date"
          name="purchaseDate"
          value={formData.purchaseDate}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {formData.image && (
          <div className="mt-2 w-24 h-24 rounded overflow-hidden">
            <img src={formData.image} alt="预览" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {item ? '保存修改' : '添加物品'}
      </button>
    </form>
  );
};

export default ItemForm;