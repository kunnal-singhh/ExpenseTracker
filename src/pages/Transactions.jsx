import useExpense from "../context/expenseContext";

const Transactions = () => {
  const { transactions } = useExpense();

  return (
    <div className="container text-light mt-4">
      <h3 className="mb-4">📄 Transactions</h3>

      <div className="card bg-black text-light rounded-3 p-3 pb-1">

        {/* Table Header */}
        <div className="row fw-semibold border-bottom border-secondary pb-2 mb-2">
          <div className="col-3">From</div>
          <div className="col-3">To</div>
          <div className="col-2 text-center">Date</div>
          <div className="col-2 text-center">Time</div>
          <div className="col-2 text-end">Amount</div>
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <p className="text-center text-secondary py-3">
            No transactions yet
          </p>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              className="row align-items-center py-2 border-bottom border-secondary rounded-3 bg-dark"
            >
              <div className="col-3">{t.from}</div>
              <div className="col-3">{t.to}</div>
              <div className="col-2 text-center">{t.date}</div>
              <div className="col-2 text-center">{t.time}</div>
              <div
                className={`col-2 text-end fw-bold ${
                  t.amount > 0 ? "text-success" : "text-danger"
                }`}
              >
                {t.amount > 0
                  ? `+₹${t.amount}`
                  : `-₹${Math.abs(t.amount)}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions;
