import React, { useState } from "react";
import useExpense from "../context/expenseContext";

const AddBalance = () => {
  const { transactions,addTransactions } = useExpense();

  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");

    const balance = transactions.reduce((acc, t) => acc + t.amount, 0);
  const add = (e) => {
    e.preventDefault();
    if ( !to || !amount) return;

    addTransactions({
      id: Date.now(),
      to,
      amount: Number(amount),
    date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
    });

   
    setTo("");
    setAmount("");
  };

  return (
    <div className=" text-light mt-4  ">
      <h3 className="mb-4">➕ Add Balance</h3>

      <div className="card bg-black text-light p-4 rounded-4 ">
        <form onSubmit={add} className="d-flex flex-column gap-3">


          {/* To */}
          <div>
            <label className="form-label">To</label>
            <input
              type="text"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Destination"
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
          <button type="submit" className="btn btn-primary mt-2">
            Add Balance
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

export default AddBalance;
