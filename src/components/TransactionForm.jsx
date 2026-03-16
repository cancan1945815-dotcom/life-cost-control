import React, { useState } from "react";
import { TRANSACTION_CATEGORIES } from "../constants";

/**
 * 记账表单组件
 * @param {Object} props
 * @param {Function} props.onAdd - 添加记账记录回调
 * @returns {JSX.Element} 记账表单组件
 */
const TransactionForm = ({ onAdd }) => {
  const today = new Date().toISOString().split("T")[0];
  
  const [formState, setFormState] = useState({
    type: "expense",
    amount: "",
    category: TRANSACTION_CATEGORIES.expense[0],
    date: today,
    note: ""
  });

  // 更新表单值
  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    // 切换交易类型时重置分类为对应类型的第一个
    if (field === "type") {
      setFormState(prev => ({
        ...prev,
        category: TRANSACTION_CATEGORIES[value][0]
      }));
    }
  };

  // 提交表单
  const handleSubmit = () => {
    if (!formState.amount || isNaN(Number(formState.amount)) || Number(formState.amount) <= 0) {
      alert("请输入有效的金额");
      return;
    }

    const newTrans = {
      id: Date.now(),
      type: formState.type,
      amount: Number(formState.amount),
      category: formState.category,
      date: formState.date,
      note: formState.note
    };

    onAdd(newTrans);
    
    // 重置表单
    setFormState(prev => ({
      ...prev,
      amount: "",
      note: "",
      date: today
    }));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* 交易类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">交易类型 <span className="text-red-500">*</span></label>
        <div className="flex gap-2">
          <button
            onClick={() => handleChange("type", "expense")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              formState.type === "expense" 
                ? "bg-red-100 text-red-700 border-red-200" 
                : "bg-white text-gray-700 border-gray-200"
            } border`}
          >
            支出
          </button>
          <button
            onClick={() => handleChange("type", "income")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              formState.type === "income" 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-white text-gray-700 border-gray-200"
            } border`}
          >
            收入
          </button>
        </div>
      </div>

      {/* 金额 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">金额（元） <span className="text-red-500">*</span></label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={formState.amount}
          onChange={(e) => handleChange("amount", e.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>

      {/* 分类 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">分类 <span className="text-red-500">*</span></label>
        <select
          value={formState.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
        >
          {TRANSACTION_CATEGORIES[formState.type].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* 日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">日期 <span className="text-red-500">*</span></label>
        <input
          type="date"
          value={formState.date}
          onChange={(e) => handleChange("date", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300"
        />
      </div>

      {/* 备注 */}
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-600 mb-1">备注（可选）</label>
        <textarea
          value={formState.note}
          onChange={(e) => handleChange("note", e.target.value)}
          placeholder="输入备注信息..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
        ></textarea>
      </div>

      {/* 提交按钮 */}
      <div className="sm:col-span-2 mt-6">
        <button
          onClick={handleSubmit}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          添加记账记录
        </button>
      </div>
    </div>
  );
};

export default TransactionForm;