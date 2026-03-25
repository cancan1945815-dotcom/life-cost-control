import React, { useState } from "react";

const TransactionForm = ({ onAdd }) => {
  const [formData, setFormData] = useState({
    type: "expense",
    category: "日常消费",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;

    const newTrans = {
      id: Date.now(),
      ...formData,
      amount: parseFloat(formData.amount)
    };

    onAdd(newTrans);
    setFormData({
      type: "expense",
      category: "日常消费",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: ""
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            类型
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>

        {/* 分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            分类
          </label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
          />
        </div>

        {/* 金额 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            金额 *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
          />
        </div>

        {/* 日期 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日期
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent"
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
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent resize-none"
        />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          保存记录
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;