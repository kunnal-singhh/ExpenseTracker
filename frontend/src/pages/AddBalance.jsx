import React, { useState } from "react";
import useExpense from "../context/expenseContext";

const AddBalance = () => {
  const { transactions, addTransactions } = useExpense();

  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [success, setSuccess] = useState(false);

  const balance = transactions.reduce((acc, t) => acc + t.amount, 0);

  const add = (e) => {
    e.preventDefault();

    if (!to || !amount || amount <= 0) {
      alert("Amount must be greater than 0");
      return;
    }

    addTransactions({
      id: Date.now(),
      to,
      amount: Number(amount),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    });

    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
    }, 2000);

    setTo("");
    setAmount("");
  };

  return (
    <div className="container mt-4 text-light">
      
      {/* Heading */}
      <h3 className="text-center mb-3">➕ Add Balance</h3>

      {/* Success Message */}
      {success && (
        <div className="alert alert-success text-center">
          Success
        </div>
      )}

      {/* Card */}
      <div className="card bg-black text-light p-3 p-md-4 rounded-4">
        <div className="row align-items-center">
          
          {/* Image Section */}
          <div className="col-12 col-md-4 text-center mb-3 mb-md-0">
            <img
              src="https://images.icon-icons.com/2785/PNG/512/money_add_icon_177347.png"
              alt="Add Balance"
              className="img-fluid"
              style={{ maxHeight: "150px" }}
            />
          </div>

          {/* Form Section */}
          <div className="col-12 col-md-8">
            <form onSubmit={add} className="d-flex flex-column gap-3">

              {/* From */}
              <div>
                <label className="form-label">From</label>
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Enter source"
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
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {/* Button */}
              <button type="submit" className="btn btn-primary w-100">
                Add Balance
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

export default AddBalance;