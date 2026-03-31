const ItemCard = ({ item, onClick, onDelete, onDuplicate }) => {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      cursor: 'pointer',
      backgroundColor: '#fff',
    }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{item.name}</h3>

          {/* 一级分类明显突出 */}
          <div style={{
            display: 'inline-block',
            backgroundColor: '#e6f7ff',
            color: '#005cbf',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            marginTop: 4,
          }}>
            {item.category}
          </div>

          <div style={{ marginTop: 6, fontSize: 14 }}>
            价格：¥{item.price?.toFixed(2)}
            {item.additionalCost > 0 && ` + 附加 ¥${item.additionalCost.toFixed(2)}`}
          </div>
          {item.expireDate && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              到期：{item.expireDate}
            </div>
          )}
          {item.purchaseDate && (
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
              购买：{item.purchaseDate}
            </div>
          )}
        </div>

        {item.image && (
          <img src={item.image} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
        )}
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(item); }}
          style={{ padding: '6px 10px', backgroundColor: '#28a745', color: '#fff', border: 0, borderRadius: 4, fontSize: 12 }}
        >
          复制
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          style={{ padding: '6px 10px', backgroundColor: '#dc3545', color: '#fff', border: 0, borderRadius: 4, fontSize: 12 }}
        >
          删除
        </button>
      </div>
    </div>
  );
};

export default ItemCard;