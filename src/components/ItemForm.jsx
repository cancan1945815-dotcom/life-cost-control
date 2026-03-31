import { useState } from 'react';

const ItemForm = ({ onAddItem }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [additionalCost, setAdditionalCost] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [expireDate, setExpireDate] = useState('');
  const [image, setImage] = useState(null);

  const calcPrice = (str) => {
    try {
      return Function(`'use strict';return (${str})`)();
    } catch {
      return 0;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalPrice = calcPrice(priceInput);
    const addCost = Number(additionalCost) || 0;

    onAddItem({
      name,
      category,
      price: finalPrice,
      additionalCost: addCost,
      purchaseDate,
      expireDate,
      image,
    });

    setName('');
    setCategory('');
    setPriceInput('');
    setAdditionalCost('');
    setPurchaseDate('');
    setExpireDate('');
    setImage(null);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #eee', padding: 16, borderRadius: 8, marginBottom: 20 }}>
      <div style={{ marginBottom: 10 }}>
        <label>物品名称</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>一级分类</label>
        <input type="text" value={category} onChange={e => setCategory(e.target.value)} required
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>价格（支持计算：100+50-10）</label>
        <input type="text" value={priceInput} onChange={e => setPriceInput(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>附加成本</label>
        <input type="number" value={additionalCost} onChange={e => setAdditionalCost(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>购买日期（可不选）</label>
        <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>到期时间（可删除）</label>
        <input type="date" value={expireDate} onChange={e => setExpireDate(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 4 }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>图片</label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && <img src={image} style={{ width: 100, height: 100, objectFit: 'cover', marginTop: 6 }} />}
      </div>

      <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#007bff', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }}>
        添加物品
      </button>
    </form>
  );
};

export default ItemForm;