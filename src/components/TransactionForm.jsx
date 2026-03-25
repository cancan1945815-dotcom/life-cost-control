import React, { useState } from "react";

const TransactionForm = ({ onAdd }) => {
  const [form, setForm] = useState({
    type: "expense",
    category: "日常消费",
    amount: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    onAdd({
      ...form,
      id: Date.now(),
      amount: Number(form.amount),
    });
    setForm((prev) => ({
      ...prev,
      amount: "",
      note: "",
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">金额</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <input
          required
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <input
          name="note"
          value={form.note}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-green-600 text-white rounded hover:bg-green-700"
      >
        保存记录
      </button>
    </form>
  );
};

export default TransactionForm;