const ItemCard = ({ item, onClick, onDelete, onDuplicate }) => {
  return (
    <div className="item-card" onClick={onClick}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h3>{item.name}</h3>
          <div className="category-tag">
            {item.category}
          </div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            价格：¥{item.price?.toFixed(2)}
            {item.additionalCost > 0 && ` + 附加 ¥${item.additionalCost.toFixed(2)}`}
          </div>
          {item.expireDate && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              到期：{item.expireDate}
            </div>
          )}
          {item.purchaseDate && (
            <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
              购买：{item.purchaseDate}
            </div>
          )}
        </div>

        {item.image && (
          <img src={item.image} alt="" />
        )}
      </div>

      <div className="card-buttons">
        <button
          className="copy-btn"
          onClick={(e) => { e.stopPropagation(); onDuplicate(item); }}
        >
          复制
        </button>
        <button
          className="delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        >
          删除
        </button>
      </div>
    </div>
  );
};

export default ItemCard;