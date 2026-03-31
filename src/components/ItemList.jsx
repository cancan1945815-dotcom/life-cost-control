import { useState } from 'react';
import ItemCard from './ItemCard';
import ItemDetailSection from './ItemDetailSection';

const ItemList = ({
  items,
  transactions,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onAddTransaction,
}) => {
  const [expandedItemId, setExpandedItemId] = useState(null);

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <ItemCard
            item={item}
            onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
            onDelete={onDeleteItem}
            onDuplicate={onDuplicateItem}
          />

          {expandedItemId === item.id && (
            <ItemDetailSection
              item={item}
              transactions={transactions.filter(t => t.itemId === item.id)}
              onAddTransaction={onAddTransaction}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ItemList;