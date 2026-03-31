import { useState } from 'react';

const TransactionForm = ({ itemId, onAddTransaction }) => {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTransaction({ amount: Number(amount), note, date });
    setAmount('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, marginBottom: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <input
          type="number"
          placeholder="金额"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="备注"
          value={note}
          onChange={e => setNote(e.target.value)}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', border: 0, borderRadius: 4 }}>
        记录支出
      </button>
    </form>
  );
};

export default TransactionForm;