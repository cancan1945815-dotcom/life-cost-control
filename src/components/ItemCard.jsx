import React, { useState } from "react";

const ItemCard = ({
  item,
  onEdit,
  onDelete,
  onUseOnce,
  onMarkFinished,
  onCopy,
  initiallyCollapsed = true
}) => {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  // 计算真实单价
  const calculateRealCost = () => {
    if (!item.price) return 0;

    // 有附加成本就加上
    const totalCost =
      item.price +
      (item.additionalCosts?.reduce((sum, c) => sum + c.amt, 0) || 0);

    // 消耗品 & 有数量 → 单件成本
    if (item.type === "consume" && item.quantity && item.quantity > 0) {
      return totalCost / item.quantity;
    }

    // 否则按使用次数算平均
    const useTimes = (item.usedCount || 0) + 1;
    return totalCost / useTimes;
  };

  const cost = calculateRealCost();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ========== 折叠头部：收起时显示核心信息 ========== */}
      <div
        className="px-4 py-3 flex flex-wrap sm:flex-nowrap justify-between items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex-1">
          <div className="font-medium text-gray-800">{item.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            {item.type === "consume" ? "消耗品" : "长期物品"}
            {item.quantity != null && ` | 总量：${item.quantity}`}
            {item.type === "consume" && item.usedCount != null && ` | 已用：${item.usedCount}`}
          </div>
        </div>

        <div className="text-sm text-gray-700 whitespace-nowrap ml-2">
          单价：¥{cost.toFixed(2)}
        </div>
      </div>

      {/* ========== 折叠头部下方：复制 + 使用 + 编辑 按钮（永远显示） ========== */}
      <div className="px-4 pb-2 flex gap-2 bg-white">
        {/* 复制按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(item);
          }}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          复制
        </button>

        {/* 使用按钮（仅消耗品可点击） */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUseOnce(item.id);
          }}
          disabled={item.type !== "consume" || item.isFinished}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            item.type !== "consume" || item.isFinished
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          使用
        </button>

        {/* 新增：编辑按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
        >
          编辑
        </button>
      </div>

      {/* ========== 展开内容 ========== */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100 text-sm space-y-3">
          {/* 价格信息 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>购入价：¥{item.price?.toFixed(2) || 0}</div>
            <div>购买日期：{item.purchaseDate}</div>
            {item.expireDate && <div>到期日：{item.expireDate}</div>}
          </div>

          {/* 附加成本 */}
          {item.additionalCosts?.length > 0 && (
            <div className="text-xs text-gray-600">
              附加成本：
              {item.additionalCosts.map((c, i) => (
                <span key={i}>
                  {c.desc}¥{c.amt.toFixed(2)}{" "}
                </span>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              编辑
            </button>

            {item.type === "consume" && !item.isFinished && (
              <button
                onClick={() => onMarkFinished(item.id)}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                标记已耗尽
              </button>
            )}

            <button
              onClick={() => onDelete(item.id)}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
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