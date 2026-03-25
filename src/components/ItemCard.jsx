import React, { useState } from "react";

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  onUseOnce,
  onUseMinus,
  onMarkFinished,
  onCopy,
  initiallyCollapsed = true
}) => {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div
        className="p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="font-medium">{item.name}</div>
        <span className="text-xs text-gray-500">{collapsed ? "展开" : "收起"}</span>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-32 object-contain border rounded bg-gray-50"
            />
          )}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>分类：{item.category}</div>
            <div>价格：¥{Number(item.price || 0).toFixed(2)}</div>
            <div>购买：{item.purchaseDate}</div>
            <div>类型：{item.type === "consume" ? "消耗品" : "耐用品"}</div>

            {item.type === "consume" && (
              <>
                <div>已用：{item.usedCount || 0} 次</div>
                <div>状态：{item.isFinished ? "已耗尽" : "使用中"}</div>
              </>
            )}
          </div>

          {item.note && (
            <div className="text-sm text-gray-600 border-t pt-2">
              备注：{item.note}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {item.type === "consume" && !item.isFinished && (
              <>
                <button
                  onClick={() => onUseMinus(item.id)}
                  className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  -1 次
                </button>
                <button
                  onClick={() => onUseOnce(item.id)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  使用 +1
                </button>
              </>
            )}

            {item.type === "consume" && !item.isFinished && (
              <button
                onClick={() => onMarkFinished(item.id)}
                className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                标记已耗尽
              </button>
            )}

            <button
              onClick={() => onEdit(item)}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              编辑
            </button>

            <button
              onClick={() => onCopy(item)}
              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              复制
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemCard;