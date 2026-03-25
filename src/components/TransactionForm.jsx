import React, { useState } from "react";

const TransactionForm = ({ onAdd }) => {
  const [form, setForm] = useState({
    type: "expense",
    category: "日用品",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    note: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert("请输入有效金额");
      return;
    }

    onAdd({
      id: Date.now(),
      ...form,
      amount: Number(form.amount)
    });

    setForm({
      type: "expense",
      category: "日用品",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: ""
    });
  };

  const categories = ["服饰", "美妆", "食品", "日用品", "数码产品", "交通", "娱乐", "医疗", "其他"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">金额（元）*</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <input
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
      >
        保存记录
      </button>
    </form>
  );
};

export default TransactionForm;