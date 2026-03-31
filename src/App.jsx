import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // 页面切换：cost = 记账, outfit = 每日穿搭
  const [page, setPage] = useState('cost');

  // ============== 记账数据 ==============
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('items');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const totalCost = transactions.reduce((s, t) => s + Number(t.amount || 0), 0);

  const addItem = (item) => {
    setItems([...items, { id: Date.now(), ...item }]);
    setShowModal(false);
  };

  const deleteItem = (id) => {
    setItems(items.filter(i => i.id !== id));
    setTransactions(transactions.filter(t => t.itemId !== id));
  };

  const duplicateItem = (item) => {
    setItems([...items, { ...item, id: Date.now() }]);
  };

  const addTransaction = (itemId, data) => {
    setTransactions([...transactions, { id: Date.now(), itemId, ...data }]);
  };

  // ============== 穿搭数据 ==============
  const [outfits, setOutfits] = useState(() => {
    const saved = localStorage.getItem('outfits');
    return saved ? JSON.parse(saved) : [];
  });

  const addOutfit = (item) => {
    setOutfits([...outfits, { id: Date.now(), ...item }]);
  };

  const deleteOutfit = (id) => {
    setOutfits(outfits.filter(i => i.id !== id));
  };

  return (
    <div className="app">
      {/* 顶部切换栏 */}
      <div className="tab-bar">
        <button className={page === 'cost' ? 'active' : ''} onClick={() => setPage('cost')}>
          物品记账
        </button>
        <button className={page === 'outfit' ? 'active' : ''} onClick={() => setPage('outfit')}>
          每日穿搭
        </button>
      </div>

      {/* 记账页面 */}
      {page === 'cost' && (
        <div className="page-content">
          <h2>物品养护记账</h2>
          <div className="summary">
            <p>总支出：¥{totalCost.toFixed(2)}</p>
          </div>

          <button className="add-btn" onClick={() => setShowModal(true)}>
            + 添加物品
          </button>

          {/* 浮窗 */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>添加物品</h3>
                <ItemForm onAddItem={addItem} onClose={() => setShowModal(false)} />
              </div>
            </div>
          )}

          <ItemList
            items={items}
            transactions={transactions}
            onDeleteItem={deleteItem}
            onDuplicateItem={duplicateItem}
            onAddTransaction={addTransaction}
          />
        </div>
      )}

      {/* 穿搭页面 */}
      {page === 'outfit' && (
        <div className="page-content">
          <h2>每日穿搭</h2>
          <div className="outfit-grid">
            {outfits.map((item) => (
              <div key={item.id} className="outfit-card">
                {item.image && <img src={item.image} alt="" />}
                <h4>{item.name}</h4>
                <div className="tag">{item.category}</div>
                <button className="del-btn" onClick={() => deleteOutfit(item.id)}>删除</button>
              </div>
            ))}
          </div>
          <button className="add-btn" onClick={() => {
            const name = prompt('穿搭名称');
            if (!name) return;
            addOutfit({ name, category: '穿搭', image: null });
          }}>+ 添加穿搭</button>
        </div>
      )}
    </div>
  );
}

// 物品表单（浮窗）
function ItemForm({ onAddItem, onClose }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [price, setPrice] = useState('');
  const [addCost, setAddCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [image, setImage] = useState(null);

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(r.result);
    r.readAsDataURL(f);
  };

  const calc = (str) => {
    try { return Function(`'use strict';return (${str})`)(); } catch { return 0; }
  };

  const submit = (e) => {
    e.preventDefault();
    const finalCat = category === '其他' ? customCat : category;
    onAddItem({
      name,
      category: finalCat,
      price: calc(price),
      additionalCost: Number(addCost) || 0,
      purchaseDate,
      expireDate,
      image
    });
  };

  return (
    <form onSubmit={submit} className="item-form">
      <label>物品名称</label>
      <input value={name} onChange={(e) => setName(e.target.value)} required />

      <label>分类</label>
      <select value={category} onChange={(e) => setCategory(e.target.value)} required>
        <option value="">请选择</option>
        <option>衣</option>
        <option>食</option>
        <option>住</option>
        <option>行</option>
        <option>娱乐</option>
        <option>护肤</option>
        <option>数码</option>
        <option>其他</option>
      </select>

      {category === '其他' && (
        <>
          <label>自定义分类</label>
          <input value={customCat} onChange={(e) => setCustomCat(e.target.value)} required />
        </>
      )}

      <label>价格（支持 100+50-20）</label>
      <input value={price} onChange={(e) => setPrice(e.target.value)} />

      <label>附加成本</label>
      <input value={addCost} onChange={(e) => setAddCost(e.target.value)} />

      <label>购买日期（可不选）</label>
      <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />

      <label>到期时间（可清空）</label>
      <input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} />

      <label>图片</label>
      <input type="file" accept="image/*" onChange={handleImage} />
      {image && <img src={image} className="prev-img" />}

      <div className="modal-btns">
        <button type="button" onClick={onClose}>取消</button>
        <button type="submit">保存</button>
      </div>
    </form>
  );
}

// 物品列表
function ItemList({ items, transactions, onDeleteItem, onDuplicateItem, onAddTransaction }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="item-list">
      {items.map((item) => (
        <div key={item.id} className="item-card">
          <div className="card-head" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
            <div>
              <h3>{item.name}</h3>
              <div className="cat-tag">{item.category}</div>
              <p>价格：¥{item.price.toFixed(2)}</p>
              {item.additionalCost > 0 && <p>附加：¥{item.additionalCost.toFixed(2)}</p>}
              {item.expireDate && <p>到期：{item.expireDate}</p>}
            </div>
            {item.image && <img src={item.image} className="card-img" />}
          </div>

          <div className="card-actions">
            <button onClick={() => onDuplicateItem(item)}>复制</button>
            <button className="del" onClick={() => onDeleteItem(item.id)}>删除</button>
          </div>

          {expanded === item.id && (
            <div className="detail">
              <h4>记账记录</h4>
              <TransactionForm itemId={item.id} onAdd={onAddTransaction} />
              <div className="trans-list">
                {transactions.filter(t => t.itemId === item.id).map((t) => (
                  <div key={t.id} className="trans-item">
                    <span>{t.date}</span>
                    <span>¥{t.amount}</span>
                    <span>{t.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 记账表单
function TransactionForm({ itemId, onAdd }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const submit = (e) => {
    e.preventDefault();
    onAdd(itemId, { amount, note, date });
    setAmount('');
    setNote('');
  };

  return (
    <form onSubmit={submit} className="trans-form">
      <input type="number" placeholder="金额" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <input placeholder="备注" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="submit">记录</button>
    </form>
  );
}

export default App;