const DailyCostSummary = ({ totalCost, dailyCost }) => {
  return (
    <div className="daily-cost-summary">
      <h3>花费统计</h3>
      <p>总花费：¥{totalCost.toFixed(2)}</p>
      <p>日均花费：¥{totalCost.toFixed(2)}</p>
    </div>
  );
};

export default DailyCostSummary;