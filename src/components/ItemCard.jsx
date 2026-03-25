import React, { useState } from "react";
import ItemForm from "./ItemForm";

const ItemCard = ({ 
  item, onEdit, onDelete, onUseOnce, onUseMinus, onMarkFinished, onCopy, onMoveCategory, categories
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const calculateTotalCost = () => {
    const base = Number(item.price) || 0;
    const add = (item.additionalCosts || []).reduce((s, c) => s + (Number(c.amt) || 0), 0);
    return base + add;
  };

  const calculateCostPerUse = () => {
    const total = calculateTotalCost();
    const used = item.usedCount || 0;
    return used === 0 ? total.toFixed(2) : (total / used).toFixed(2);
  };

  const calculateUnitCost = () => {
    if (!item.quantity) return null;
    return (calculateTotalCost() / Number(item.quantity)).toFixed(2);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border">
        <ItemForm item={item} categories={categories} onSubmit={(d)=>{onEdit(d);setIsEditing(false);}} />
        <button onClick={()=>setIsEditing(false)} className="mt-3 w-full py-2 bg-gray-200 rounded">取消</button>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md border ${item.isFinished?"bg-gray-50 border-gray-400":""}`}>
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{item.name}</h3>
        <button onClick={()=>setExpanded(!expanded)} className="text-sm text-blue-600">{expanded?"收起 ↑":"展开 ↓"}</button>
      </div>

      {/* 折叠时极简显示 */}
      {!expanded && (
        <div className="mt-1 text-sm flex gap-3">
          <span>单次 ¥{calculateCostPerUse()}</span>
          {calculateUnitCost() && <span>单价 ¥{calculateUnitCost()}</span>}
        </div>
      )}

      {expanded && (
        <div className="mt-2 text-sm">
          <p>分类：{item.category}</p>
          <p>总成本：¥{calculateTotalCost().toFixed(2)}</p>
          <p>已使用：{item.usedCount || 0} 次</p>
          {item.quantity && <p>总量：{item.quantity}</p>}
          {item.image && <img src={item.image} className="w-full h-32 object-cover rounded mt-2" />}
        </div>
      )}

      {expanded && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {item.type ==="consume" && !item.isFinished && <button onClick={()=>onUseOnce(item.id)} className="py-1 bg-green-500 text-white rounded text-sm">使用一次</button>}
          <button onClick={()=>setIsEditing(true)} className="py-1 bg-blue-500 text-white rounded text-sm">编辑</button>
          <button onClick={()=>onCopy(item)} className="py-1 bg-purple-500 text-white rounded text-sm">复制</button>
          <button onClick={()=>{const newCat=prompt("输入目标分类",item.category);if(newCat)onMoveCategory(item.id,newCat);}} className="py-1 bg-yellow-500 text-white rounded text-sm">移动分类</button>
          <button onClick={()=>onDelete(item.id)} className="col-span-2 py-1 bg-red-500 text-white rounded text-sm">删除</button>
        </div>
      )}
    </div>
  );
};

export default ItemCard;