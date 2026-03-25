import React, { useState, useEffect } from "react";
import Calculator from "./Calculator";

const ItemForm = ({ item = {}, categories, onSubmit, recentCategory }) => {
  const [formState, setFormState] = useState({
    name: item.name || "",
    price: item.price?.toString() || "",
    purchaseDate: item.purchaseDate || "",
    expireDate: item.expireDate || "",
    type: item.type || "long",
    category: item.category || recentCategory || "服饰",
    customCategory: "",
    quantity: item.quantity?.toString() || "",
    usedCount: item.usedCount?.toString() || "",
    additionalCosts: [...(item.additionalCosts || [])],
    image: item.image || null
  });
  
  const [calculatorValue, setCalculatorValue] = useState(formState.price);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    if (item.name?.includes("（副本）") && !item.id) {
      const nameInput = document.querySelector('input[placeholder="如：纯棉T恤、无线鼠标"]');
      if (nameInput) {
        nameInput.focus();
        const suffixIndex = nameInput.value.indexOf('（副本）');
        if (suffixIndex > -1) {
          nameInput.setSelectionRange(suffixIndex, nameInput.value.length);
        }
      }
    }
  }, [item]);

  const handleChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (field === "price") setCalculatorValue(value);
  };

  const handleCalculatorKeyPress = (key) => {
    if (key === "C") {
      setCalculatorValue("");
      handleChange("price", "");
    } else if (key === "=") {
      try {
        const sanitized = calculatorValue
          .replace(/[^0-9+\-*/.()]/g, "")
          .replace(/(\d+)\.(\d*)\./g, "$1.$2")
          .replace(/(\+|\-|\*|\/){2,}/g, "$1");
        
        if (sanitized) {
          const result = eval(sanitized);
          setCalculatorValue(result.toString());
          handleChange("price", result.toString());
        }
      } catch (e) {
        setCalculatorValue("错误");
      }
    } else {
      setCalculatorValue(prev => prev === "错误" ? key : prev + key);
    }
  };

  const addAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述（如：运费、安装费）：");
    const amt = prompt("请输入附加成本金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("描述不能为空，金额必须是数字！");
      return;
    }
    setFormState(prev => ({
      ...prev,
      additionalCosts: [...prev.additionalCosts, { desc, amt: Number(amt) }]
    }));
  };

  const removeAdditionalCost = (index) => {
    setFormState(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index)
    }));
  };

  // ====================== 修复：图片永久保存（Base64） ======================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange("image", reader.result); // 保存 Base64
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (window.confirm("确定删除这张图片吗？")) {
      handleChange("image", null);
    }
  };

  const handleSubmit = () => {
    const { customCategory, ...submitData } = formState;
    
    let finalCategory = submitData.category;
    if (finalCategory === "自定义") {
      finalCategory = customCategory.trim();
      if (!finalCategory) {
        alert("请输入自定义分类名称");
        return;
      }
    }

    submitData.price = Number(submitData.price);
    if (submitData.type === "consume") {
      submitData.quantity = submitData.quantity ? Number(submitData.quantity) : null;
      submitData.usedCount = submitData.usedCount ? Number(submitData.usedCount) : 0;
    } else {
      submitData.quantity = null;
      submitData.usedCount = null;
    }

    submitData.category = finalCategory;
    submitData.id = item.id || Date.now();
    submitData.isFinished = item.isFinished || false;
    submitData.inTrash = item.inTrash || false;

    onSubmit(submitData, finalCategory);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-600 mb-1">物品名称 <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={formState.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="如：纯棉T恤、无线鼠标"
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-600 mb-1">价格（元） <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            type="text"
            value={formState.price}
            onChange={(e) => handleChange("price", e.target.value)}
            placeholder="0.00 或输入计算公式（如：100+20*2）"
            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 pr-20"
          />
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
          >
            {showCalculator ? "收起计算器" : "使用计算器"}
          </button>
        </div>
        
        {showCalculator && (
          <Calculator value={calculatorValue} onKeyPress={handleCalculatorKeyPress} />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">购买日期 <span className="text-red-500">*</span></label>
        <input
          type="date"
          value={formState.purchaseDate}
          onChange={(e) => handleChange("purchaseDate", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">到期日期（可选）</label>
        <input
          type="date"
          value={formState.expireDate}
          onChange={(e) => handleChange("expireDate", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">物品类型 <span className="text-red-500">*</span></label>
        <select
          value={formState.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          <option value="long">长期物品（如电器、家具）</option>
          <option value="consume">消耗品（如服饰、食品、日用品）</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">物品分类 <span className="text-red-500">*</span></label>
        
        <select
          value={formState.category}
          onChange={(e) => {
            handleChange("category", e.target.value);
            if (e.target.value !== "自定义") handleChange("customCategory", "");
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
          <option value="自定义">自定义分类</option>
        </select>
        
        {formState.category === "自定义" && (
          <input
            type="text"
            placeholder="输入自定义分类名称"
            value={formState.customCategory}
            onChange={(e) => handleChange("customCategory", e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        )}
      </div>

      {formState.type === "consume" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">总数量（可选）</label>
            <input
              type="number"
              value={formState.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              placeholder="如：10片、5件"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">初始使用次数（可选）</label>
            <input
              type="number"
              min="0"
              value={formState.usedCount}
              onChange={(e) => handleChange("usedCount", e.target.value)}
              placeholder="默认0次"
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </>
      )}

      <div className="sm:col-span-2 mt-4">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-600">附加成本（如运费、安装费）</label>
          <button
            onClick={addAdditionalCost}
            className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
          >
            添加
          </button>
        </div>

        {formState.additionalCosts.length > 0 && (
          <div className="bg-gray-50 rounded-md p-3 mt-2">
            {formState.additionalCosts.map((cost, index) => (
              <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                <span className="text-sm text-gray-700">{cost.desc}：{cost.amt.toFixed(2)}元</span>
                <button
                  onClick={() => removeAdditionalCost(index)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sm:col-span-2 mt-4">
        <label className="block text-sm font-medium text-gray-600 mb-2">凭证图片（可选）</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full"
        />

        {formState.image && (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={formState.image}
              alt="物品凭证"
              className="w-20 h-20 object-cover rounded-md border border-gray-200"
            />
            <button
              onClick={removeImage}
              className="text-sm text-red-500 hover:text-red-700"
            >
              删除图片
            </button>
          </div>
        )}
      </div>

      <div className="sm:col-span-2 mt-6">
        <button
          onClick={handleSubmit}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          disabled={!formState.name || !formState.price || !formState.purchaseDate}
        >
          {item.id ? "保存修改" : "添加物品"}
        </button>
      </div>
    </div>
  );
};

export default ItemForm;