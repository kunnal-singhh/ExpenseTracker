import useExpense from "../context/expenseContext";
import { useState } from "react";
const Transactions = () => {
  const { transactions } = useExpense();
  const [filterType, setFilterType] = useState("all");

const filteredTransactions = transactions.filter(t => {
  if (filterType === "income") {
    return t.amount > 0;
  }

  if (filterType === "expense") {
    return t.amount < 0;
  }

  return true; // all
});

  return (
    <div className="w-100 text-light mt-4 p-0 ">
      <h3 className="mb-4 d-flex justify-content-between align-items-center ">📄 Transactions {<select
  className="form-select bg-dark text-light border-secondary " style={{width:'15px'}}
  value={filterType}
  onChange={(e) => setFilterType(e.target.value)}
>
  <option value="all">All</option>
  <option value="income">Income</option>
  <option value="expense">Expense</option>
</select>
}</h3>

      <div className="card bg-black text-light rounded-3 p-3 pb-1 ">

        {/* Table Header */}
        <div className="row fw-semibold border-bottom border-secondary pb-2 mb-2">
          <div className="col-5 ms-3">Details</div>
          <div className="col-6 text-end">Amount</div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <p className="text-center text-secondary py-3">
            No transactions yet
          </p>
        ) : (
          filteredTransactions.map((t) => (
            <div
              key={t.id}
              className="row align-items-center pt-2 pb-2 border-bottom border-secondary rounded-3 bg-dark"
            >
            
              <div className="col-9 ">{t.to} 
                  <div className="d-flex justify-content-start align-items-center gap-1"> 
                    <span style={{fontSize:'10px',color:'#b0b0b0ff'}}>{t.date}</span>
                  <span style={{fontSize:'10px',color:'#b0b0b0ff'}}>{t.time}</span>
                </div>
              </div>
              {/* <div className="col-2 text-center">{t.date}</div>
              <div className="col-2 text-center">{t.time}</div> */}
              <div
                className={`col-3 text-end fw-bold d-flex flex-column justify-content-center align-items-end gap-2 ${
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
