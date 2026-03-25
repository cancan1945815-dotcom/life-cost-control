import React, { useState } from "react";

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  onUseOnce,
  onUseMinus,
  onMarkFinished,
  onCopy,
  initiallyCollapsed = true,
}) => {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  // 单次成本计算
  const singleCost =
    item.type === "consume" && item.usedCount > 0
      ? (Number(item.price) / item.usedCount).toFixed(2)
      : "—";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 头部：名称 + 折叠开关 */}
      <div
        className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="w-8 h-8 object-cover rounded border"
            />
          )}
          <span className="font-medium text-gray-800">{item.name}</span>
          {item.isFinished && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 rounded">
              已耗尽
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {collapsed ? "展开" : "收起"}
        </span>
      </div>

      {/* 展开内容 */}
      {!collapsed && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3 text-sm">
          {/* 基础信息 */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>分类：{item.category}</div>
            <div>单价：¥{Number(item.price || 0).toFixed(2)}</div>
            {item.type === "consume" && (
              <>
                <div>已使用：{item.usedCount || 0} 次</div>
                <div>单次成本：¥{singleCost}</div>
              </>
            )}
          </div>

          {/* 备注 */}
          {item.note && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              {item.note}
            </div>
          )}

          {/* 消耗品操作区 */}
          {item.type === "consume" && !item.isFinished && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUseMinus(item.id);
                }}
                className="px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300"
              >
                −次数
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUseOnce(item.id);
                }}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
              >
                +使用1次
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkFinished(item.id);
                }}
                className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
              >
                标记耗尽
              </button>
            </div>
          )}

          {/* 功能按钮 */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              编辑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(item);
              }}
              className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              复制
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
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