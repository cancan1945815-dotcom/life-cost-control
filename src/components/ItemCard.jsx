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

  // 计算不同类型物品的成本展示信息
  const calculateCostInfo = () => {
    if (!item.price) return { mainText: "¥0.00", subText: "" };

    // 计算总成本（原价 + 附加成本）
    const totalCost = item.price + (item.additionalCosts?.reduce((sum, c) => sum + c.amt, 0) || 0);

    // 1. 长期物品：计算每日成本（按购买日到今日的天数均摊）
    if (item.type === "long") {
      if (!item.purchaseDate) return { mainText: "¥0.00/日", subText: `总价：¥${totalCost.toFixed(2)}` };
      
      // 计算购买至今的天数（最少1天，避免除以0）
      const purchaseDate = new Date(item.purchaseDate);
      const today = new Date();
      const daysPassed = Math.max(1, Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24)));
      const dailyCost = totalCost / daysPassed;
      
      return {
        mainText: `¥${dailyCost.toFixed(4)}/日`, // 每日成本（保留4位小数更精准）
        subText: `总价：¥${totalCost.toFixed(2)} | 已使用${daysPassed}天`
      };
    }

    // 2. 消耗品：显示总价 + 单价
    if (item.type === "consume") {
      let unitCost = 0;
      let unitDesc = "";

      // 有明确数量 → 单价=总价/数量
      if (item.quantity && item.quantity > 0) {
        unitCost = totalCost / item.quantity;
        unitDesc = "单件成本";
      } 
      // 无数量 → 按使用次数算
      else {
        const useTimes = (item.usedCount || 0) + 1;
        unitCost = totalCost / useTimes;
        unitDesc = "单次成本";
      }

      return {
        mainText: `¥${unitCost.toFixed(2)}/${item.quantity ? "件" : "次"}`, // 单价
        subText: `总价：¥${totalCost.toFixed(2)} | ${unitDesc}` // 总价+单价说明
      };
    }

    // 兜底
    return { mainText: `¥${totalCost.toFixed(2)}`, subText: "" };
  };

  const costInfo = calculateCostInfo();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ========== 折叠头部：显示核心信息 + 成本 ========== */}
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

        {/* 成本展示：区分长期/消耗品 */}
        <div className="text-right ml-2">
          <div className="text-sm font-medium text-gray-700">{costInfo.mainText}</div>
          <div className="text-xs text-gray-500">{costInfo.subText}</div>
        </div>
      </div>

      {/* ========== 操作按钮区：复制 + 增减使用次数 + 编辑 ========== */}
      <div className="px-4 pb-2 flex gap-2 bg-white flex-wrap">
        {/* 复制按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // 防止触发折叠/展开
            onCopy(item);
          }}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          复制
        </button>

        {/* 消耗品专属：使用次数增减按钮组 */}
        {item.type === "consume" && (
          <div className="flex gap-1">
            {/* 减1按钮（禁用条件：已用次数≤0 或 已耗尽） */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseMinus(item.id);
              }}
              disabled={item.isFinished || (item.usedCount || 0) <= 0}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                item.isFinished || (item.usedCount || 0) <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 text-white hover:bg-red-700"
              }`}
            >
              减1
            </button>

            {/* 加1按钮（禁用条件：已耗尽） */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUseOnce(item.id);
              }}
              disabled={item.isFinished}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                item.isFinished
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              加1
            </button>
          </div>
        )}

        {/* 编辑按钮 */}
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

      {/* ========== 展开内容（保留原有详情） ========== */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100 text-sm space-y-3">
          {/* 价格信息 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>购入价：¥{item.price?.toFixed(2) || 0}</div>
            <div>购买日期：{item.purchaseDate || "未填写"}</div>
            {item.expireDate && <div>到期日：{item.expireDate}</div>}
            {/* 总成本（含附加成本） */}
            <div colSpan="2">总成本：¥{(item.price + (item.additionalCosts?.reduce((sum, c) => sum + c.amt, 0) || 0)).toFixed(2)}</div>
          </div>

          {/* 附加成本 */}
          {item.additionalCosts?.length > 0 && (
            <div className="text-xs text-gray-600">
              附加成本：
              {item.additionalCosts.map((c, i) => (
                <span key={i}>
                  {c.desc}¥{c.amt.toFixed(2)} {" "}
                </span>
              ))}
            </div>
          )}

          {/* 展开后的操作按钮（保留原有） */}
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