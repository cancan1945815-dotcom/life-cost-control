import React from 'react';

/**
 * 计算器组件
 * @param {Object} props
 * @param {string} props.value - 计算器当前值
 * @param {Function} props.onKeyPress - 按键点击回调
 * @returns {JSX.Element} 计算器组件
 */
const Calculator = ({ value, onKeyPress }) => {
  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+", "(", ")", "C"];
  
  return (
    <div className="mt-2 bg-gray-100 rounded-md p-3">
      <div className="mb-2 bg-white p-2 rounded text-right font-mono overflow-x-auto">
        {value || "0"}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {keys.map(key => (
          <button
            key={key}
            onClick={() => onKeyPress(key)}
            className={`py-2 px-1 rounded ${
              key === "C" ? "bg-red-100 text-red-700" :
              key === "=" ? "bg-green-100 text-green-700" :
              ["+", "-", "*", "/", "(", ")"].includes(key) ? "bg-yellow-100 text-yellow-700" :
              "bg-white text-gray-800"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;