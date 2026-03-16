import React, { useState } from "react";
import { getTotalCost, getDayCost, getUseCost, getRemainingQuantity } from "../utils";

/**
 * 物品卡片组件
 * @param {Object} props
 * @param {Object} props.item - 物品数据
 * @param {Function} props.onEdit - 编辑回调
 * @param {Function} props.onDelete - 删除回调
 * @param {Function} props.onUseOnce - 使用一次回调
 * @param {Function} props.onMarkFinished - 标记耗尽回调
 * @param {boolean} props.initiallyCollapsed - 是否默认折叠
 * @returns {JSX.Element} 物品卡片组件
 */
const ItemCard = ({ 
  item, 
  onEdit, 
  onDelete, 
  onUseOnce, 
  onMarkFinished,
  initiallyCollapsed = true
}) => {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* 折叠头部 */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
      >
        <div className="flex items-center">
          <h3 className="font-medium text-gray-800">{item.name}</h3>
          {item.type === "consume" && (
            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
              item.isFinished
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}>
              {item.isFinished ? "已耗尽" : "使用中"}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          {item.type === "consume" && item.quantity && (
            <span className="text-gray-600">
              剩余：{getRemainingQuantity(item)}
            </span>
          )}
          <span className="text-gray-700 font-medium">
            {item.type === "long" ? "日成本" : "次成本"}：¥{item.type === "long" ? getDayCost(item) : getUseCost(item)}
          </span>
          <span className="text-gray-500">
            {collapsed ? "▼ 展开" : "▲ 收起"}
          </span>
        </div>
      </div>

      {/* 展开内容 */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
            <p className="text-gray-600">
              <span className="font-medium text-gray-700">总价：</span>
              ¥{getTotalCost(item).toFixed(2)}（含附加）
            </p>
            <p className="text-gray-600">
              <span className="font-medium text-gray-700">购买日期：</span>
              {item.purchaseDate}
            </p>
            {item.expireDate && (
              <p className="text-gray-600">
                <span className="font-medium text-gray-700">到期日期：</span>
                {item.expireDate}
              </p>
            )}
            {item.type === "consume" && (
              <p className="text-gray-600">
                <span className="font-medium text-gray-700">已使用：</span>
                {item.usedCount || 0} 次
              </p>
            )}
          </div>

          {/* 附加成本 */}
          {item.additionalCosts && item.additionalCosts.length > 0 && (
            <div className="mb-4 text-sm">
              <details>
                <summary className="font-medium text-gray-700 cursor-pointer">查看附加成本</summary>
                <div className="mt-2 bg-gray-50 rounded-md p-2">
                  {item.additionalCosts.map((cost, idx) => (
                    <p key={idx} className="text-gray-600">- {cost.desc}：¥{cost.amt.toFixed(2)}</p>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* 物品图片 */}
          {item.image && (
            <div className="mb-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-md border border-gray-200"
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {item.type === "consume" && !item.isFinished && (
              <>
                <button
                  onClick={() => onUseOnce(item.id)}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                >
                  使用一次（+1）
                </button>
                <button
                  onClick={() => onMarkFinished(item.id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                >
                  标记为耗尽
                </button>
              </>
            )}

            <div className="ml-auto flex gap-2">
              <button
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                编辑
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="px-3 py-1.5 bg-gray-200 text-red-600 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCard;