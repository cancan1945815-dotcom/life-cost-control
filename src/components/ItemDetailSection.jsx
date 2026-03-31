import TransactionForm from './TransactionForm';
import './ItemDetailSection.css';

const ItemDetailSection = ({ item, transactions, onUpdateItem, onAddTransaction }) => {
  return (
    <div className="item-detail">
      <h4>使用记录 & 记账</h4>

      {/* 记账表单 */}
      <TransactionForm
        itemId={item.id}
        onAddTransaction={(data) => onAddTransaction(item.id, data)}
      />

      {/* 交易记录列表 */}
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