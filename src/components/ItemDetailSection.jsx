import TransactionForm from './TransactionForm';

const ItemDetailSection = ({ item, transactions, onAddTransaction }) => {
  return (
    <div className="item-detail">
      <h4>使用记录 & 记账</h4>

      <TransactionForm
        itemId={item.id}
        onAddTransaction={(data) => onAddTransaction(item.id, data)}
      />

      <div className="transaction-list">
        {transactions.length === 0 ? (
          <p>暂无记录</p>
        ) : (
          transactions.map((t) => (
            <div key={t.id} className="transaction-item">
              <span>{new Date(t.date).toLocaleDateString()}</span>
              <span>¥{t.amount}</span>
              <p>{t.note}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ItemDetailSection;