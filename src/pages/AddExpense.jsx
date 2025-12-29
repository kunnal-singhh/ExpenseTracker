import React, { useState } from "react";
import useExpense from "../context/expenseContext";

const AddExpense = () => {
  const { transactions, addTransactions } = useExpense();

  const [amount, setAmount] = useState("");
 
  const [to, setTo] = useState("");
  const [error, setError] = useState("");

  // ✅ Current balance
  const balance = transactions.reduce((acc, t) => acc + t.amount, 0);

  const add = (e) => {
    e.preventDefault();

    if ( !to || !amount) return;

    // ❌ Balance zero
    if (balance <= 0) {
      setError("Balance is zero. You cannot add an expense.");
      return;
    }

    // ❌ Expense exceeds balance
    if (Number(amount) > balance) {
      setError("Expense amount is greater than available balance.");
      return;
    }

    // ✅ Valid expense
    addTransactions({
      id: Date.now(),
  
      to,
      amount: -Number(amount),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    });

   
    setTo("");
    setAmount("");
    setError("");
  };

  return (
    <div className="container text-light mt-4 ">
      <h3 className="mb-4">➖ Add Expense</h3>

      <div className="card bg-black text-light p-4 rounded-4 col-12 col-md-7 col-lg-5 mx-auto">
        <form onSubmit={add} className="d-flex flex-column gap-3">

          {/* Error Message (Theme Safe) */}
          {error && (
            <div className="text-danger text-center fw-semibold">
              {error}
            </div>
          )}

         

          {/* To */}
          <div>
            <label className="form-label">To</label>
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Spent on"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          {/* Amount */}
          <div>
            <label className="form-label">Amount</label>
            <input
              type="number"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Enter expense amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            className="btn btn-danger mt-2"
            disabled={balance <= 0}
          >
            Add Expense
          </button>

          {/* Balance Info */}
          <small className="text-secondary text-center">
            Available Balance: ₹{balance}
          </small>

        </form>
      </div>
    </div>
  );
};

export default AddExpense;
