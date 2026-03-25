import React, { useState } from "react";

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  onUseOnce,
  onUseMinus,
  onMarkFinished,
  onCopy,
  initiallyCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed);

  // 计算每日成本（非消耗品）
  const calculateDailyCost = (purchaseDate, price) => {
    if (!purchaseDate || !price || price <= 0) return "0.00";
    try {
      const buyDay = new Date(purchaseDate);
      const today = new Date();
      const diffTime = today - buyDay;
      const days = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      return (price / days).toFixed(2);
    } catch {
      return "0.00";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
      {/* 卡片头部 */}
      <div
        className="px-4 py-3 cursor-pointer flex justify-between items-center bg-gray-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span className="font-medium text-gray-800">{item.name}</span>
          <span className="text-blue-600 font-bold">¥{item.price}</span>

          {/* 非消耗品 → 显示每日成本 */}
          {item.type !== "consume" && (
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
              每日 ¥{calculateDailyCost(item.purchaseDate, item.price)}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-sm">
          {isCollapsed ? "▼ 展开" : "▲ 收起"}
        </span>
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="space-y-3">
            {item.image && (
              <div className="w-full h-40 rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">分类：</span>
                <span className="font-medium">{item.category}</span>
              </div>
              <div>
                <span className="text-gray-500">购买日期：</span>
                <span className="font-medium">{item.purchaseDate}</span>
              </div>
              <div>
                <span className="text-gray-500">类型：</span>
                <span className="font-medium">
                  {item.type === "consume" ? "消耗品" : "非消耗品"}
                </span>
              </div>

              {item.type === "consume" && (
                <div>
                  <span className="text-gray-500">使用次数：</span>
                  <span className="font-medium">{item.usedCount || 0}</span>
                </div>
              )}
            </div>

            {item.brand && (
              <div className="text-sm">
                <span className="text-gray-500">品牌：</span>
                <span className="font-medium">{item.brand}</span>
              </div>
            )}

            {item.spec && (
              <div className="text-sm">
                <span className="text-gray-500">规格：</span>
                <span className="font-medium">{item.spec}</span>
              </div>
            )}

            {item.note && (
              <div className="text-sm">
                <span className="text-gray-500">备注：</span>
                <span className="font-medium">{item.note}</span>
              </div>
            )}

            {/* 按钮组 */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => onEdit(item)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                编辑
              </button>

              <button
                onClick={onCopy}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                复制
              </button>

              {item.type === "consume" && (
                <>
                  <button
                    onClick={onUseMinus}
                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors"
                  >
                    减少次数
                  </button>
                  <button
                    onClick={onUseOnce}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    使用一次
                  </button>
                  {!item.isFinished && (
                    <button
                      onClick={onMarkFinished}
                      className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                    >
                      标记已耗尽
                    </button>
                  )}
                </>
              )}

              <button
                onClick={onDelete}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors ml-auto"
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