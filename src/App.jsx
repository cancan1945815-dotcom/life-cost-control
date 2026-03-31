import { useState, useEffect } from 'react';
import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import DailyCostSummary from './components/DailyCostSummary';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // 本地存储加载
  useEffect(() => {
    const savedItems = localStorage.getItem('items');
    const savedTrans = localStorage.getItem('transactions');
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedTrans) setTransactions(JSON.parse(savedTrans));
  }, []);

  // 保存到本地
  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  // 计算
  const totalCost = transactions.reduce((s, t) => s + t.amount, 0);
  const days = Math.max(1, Math.ceil((Date.now() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24)));
  const dailyCost = totalCost / days;

  // 增删改
  const addItem = (item) => {
    setItems([...items, { ...item, id: Date.now() }]);
  };

  const updateItem = (id, data) => {
    setItems(items.map(i => i.id === id ? { ...i, ...data } : i));
  };

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id));
    setTransactions(transactions.filter(t => t.itemId !== id));
  };

  // 复制物品
  const duplicateItem = (item) => {
    const copy = {
      ...item,
      id: Date.now(),
      name: item.name + '（副本）',
    };
    setItems([...items, copy]);
  };

  const addTransaction = (itemId, data) => {
    setTransactions([
      ...transactions,
      { id: Date.now(), itemId, ...data, date: data.date || new Date().toISOString() }
    ]);
  };

  return (
    <div className="app" style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <h2>物品养护记账本</h2>
      <DailyCostSummary totalCost={totalCost} dailyCost={dailyCost} />
      <ItemForm onAddItem={addItem} />
      <ItemList
        items={items}
        transactions={transactions}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onDuplicateItem={duplicateItem}
        onAddTransaction={addTransaction}
      />
    </div>
  );
}

export default App;