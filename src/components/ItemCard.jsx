import React from 'react';

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
  // 计算非消耗品每日成本
  const calculateDailyCost = (price, purchaseDate) => {
    if (!price || !purchaseDate) return '0.00';
    const buyDay = new Date(purchaseDate);
    const today = new Date();
    const days = Math.max(1, Math.floor((today - buyDay) / (1000 * 60 * 60 * 24)));
    return (Number(price) / days).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        {/* 图片（持久化不丢失） */}
        {item.image && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {/* 名称 */}
          <h3 className="font-medium text-gray-800 truncate">
            {item.name}
          </h3>
          
          {/* 成本展示：非消耗品=每日成本，消耗品=单次成本 */}
          <div className="mt-1">
            {item.type !== 'consume' ? (
              <p className="text-sm text-blue-600 font-bold">
                每日成本：¥{calculateDailyCost(item.price, item.purchaseDate)}
              </p>
            ) : (
              <p className="text-sm text-green-600 font-bold">
                单次成本：¥{(Number(item.price) / ((item.usedCount || 0) + 1)).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;