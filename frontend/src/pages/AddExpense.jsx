import React, { useState } from "react";
import useExpense from "../context/expenseContext";

const AddExpense = () => {
  const { transactions, addTransactions } = useExpense();

  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const balance = transactions.reduce((acc, t) => acc + t.amount, 0);

  const add = (e) => {
    e.preventDefault();

    if (!to || !amount || amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (balance <= 0) {
      setError("Balance is zero. You cannot add an expense.");
      return;
    }

    if (Number(amount) > balance) {
      setError("Expense exceeds available balance.");
      return;
    }

    addTransactions({
      // id: Date.now(),
      to,
      amount: -Number(amount),
      // date: new Date().toLocaleDateString(),
      // time: new Date().toLocaleTimeString(),
    });

    setSuccess(true);
    setError("");

    setTimeout(() => {
      setSuccess(false);
    }, 2000);

    setTo("");
    setAmount("");
  };

  return (
    <div className="container mt-4 text-light">
      
      {/* Heading */}
      <h3 className="text-center mb-3">➖ Add Expense</h3>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success text-center">
          Expense Added Successfully
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger text-center">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="card bg-black text-light p-3 p-md-4 rounded-4">
        <div className="row align-items-center">
          
          {/* Image Section */}
          <div className="col-12 col-md-4 text-center mb-3 mb-md-0">
            <img
              src="https://cdn-icons-png.flaticon.com/512/1828/1828843.png"
              alt="Expense"
              className="img-fluid"
              style={{ maxHeight: "150px" }}
            />
          </div>

          {/* Form Section */}
          <div className="col-12 col-md-8">
            <form onSubmit={add} className="d-flex flex-column gap-3">

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
                 onClick={() => {
    if (balance <= 0) {
      setError("Not enough balance");
    }
  }}
                className="btn btn-danger w-100"
                // disabled={balance <= 0}
              >
                Add Expense
              </button>

              {/* Balance */}
              <small className="text-secondary text-center">
                Available Balance: ₹{balance}
              </small>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;