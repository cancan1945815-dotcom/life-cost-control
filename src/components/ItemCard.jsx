import React, { useState } from "react";
import ItemForm from "./ItemForm"; // 这里已修复！！！

const ItemCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onUse, 
  onMarkFinished,
  onCopy
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // 计算总成本
  const calculateTotalCost = () => {
    const basePrice = Number(item.price) || 0;
    const additionalCosts = item.additionalCosts || [];
    return additionalCosts.reduce((sum, cost) => sum + (Number(cost.amt) || 0), basePrice);
  };

  // 计算单次成本
  const calculateCostPerUse = () => {
    const total = calculateTotalCost();
    const usedCount = Number(item.usedCount) || 0;
    if (usedCount === 0) return total.toFixed(2);
    return (total / usedCount).toFixed(2);
  };

  // 编辑提交
  const handleEditSubmit = (updatedItem) => {
    onEdit(updatedItem);
    setIsEditing(false);
  };

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return "无";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <ItemForm
          item={item}
          categories={["服饰", "美妆", "食品", "日用品", "数码产品", "自定义"]}
          onSubmit={handleEditSubmit}
          recentCategory={item.category}
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            取消编辑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border ${item.isFinished ? "border-gray-400 bg-gray-50" : "border-blue-100"}`}>
      {/* 标题和状态 */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${item.type === "consume" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
          {item.type === "consume" ? "消耗品" : "长期物品"}
        </span>
      </div>

      {/* 分类 */}
      <p className="text-sm text-gray-500 mb-2">分类：{item.category}</p>

      {/* 价格信息 */}
      <div className="text-sm text-gray-600 mb-2">
        <p>原价：¥{Number(item.price).toFixed(2)}</p>
        <p>总成本：¥{calculateTotalCost().toFixed(2)}</p>
        {item.type === "consume" && (
          <p>单次成本：¥{calculateCostPerUse()}</p>
        )}
      </div>

      {/* 日期 */}
      <div className="text-sm text-gray-600 mb-3">
        <p>购买日期：{formatDate(item.purchaseDate)}</p>
        {item.expireDate && <p>到期日期：{formatDate(item.expireDate)}</p>}
      </div>

      {/* 消耗品专属信息 */}
      {item.type === "consume" && (
        <div className="text-sm text-gray-600 mb-3">
          <p>已使用：{item.usedCount || 0} 次</p>
          {item.quantity && <p>总数量：{item.quantity}</p>}
        </div>
      )}

      {/* 图片预览 */}
      {item.image && (
        <div className="mb-3">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}

      {/* 附加成本 */}
      {item.additionalCosts && item.additionalCosts.length > 0 && (
        <div className="mb-3 text-xs text-gray-500">
          <p>附加成本：</p>
          {item.additionalCosts.map((cost, idx) => (
            <div key={idx}>{cost.desc}：¥{Number(cost.amt).toFixed(2)}</div>
          ))}
        </div>
      )}

      {/* 按钮组 */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        {item.type === "consume" && !item.isFinished && (
          <button
            onClick={() => onUse(item.id)}
            className="px-2 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
          >
            使用一次
          </button>
        )}

        {!item.isFinished && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            编辑
          </button>
        )}

        <button
          onClick={() => onCopy(item)}
          className="px-2 py-1 bg-purple-500 text-white rounded-md text-sm hover:bg-purple-600"
        >
          复制
        </button>

        {item.type === "consume" && !item.isFinished && (
          <button
            onClick={() => onMarkFinished(item.id)}
            className="px-2 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
          >
            已耗尽
          </button>
        )}

        <button
          onClick={() => onDelete(item.id)}
          className="col-span-2 px-2 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
        >
          删除
        </button>
      </div>
    </div>
  );
};

export default ItemCard;