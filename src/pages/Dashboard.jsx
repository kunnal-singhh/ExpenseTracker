import React from "react";
import useExpense from '../context/expenseContext';
import Transactions from "./Transactions";

const Dashboard = () => {
  const { transactions } = useExpense();

  // Calculations
  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + t.amount, 0);
   
  const balance = income + expense;
  
  return (
    <div className=" text-light mt-4 ">
      <h3 className="mb-4">📊 Dashboard</h3>

      {/* Summary Cards */}
      <div className="row g-3 mb-5 ">

        {/* Income */}
        <div className="col-12 col-md-4">
          <div className="card bg-black text-light rounded-4 p-4 text-center">
            <h6 className="text-secondary">Added Amount</h6>
            <h2 className="text-success mt-2">₹{income}</h2>
          </div>
        </div>

        {/* Expense */}
        <div className="col-12 col-md-4">
          <div className="card bg-black text-light rounded-4 p-4 text-center">
            <h6 className="text-secondary">Expense Amount</h6>
            <h2 className="text-danger mt-2">₹{Math.abs(expense)}</h2>
          </div>
        </div>

        {/* Balance */}
        <div className="col-12 col-md-4">
          <div className="card bg-black text-light rounded-4 p-4 text-center">
            <h6 className="text-secondary">Remaining Balance</h6>
            <h2
              className={`mt-2 ${
                balance >= 0 ? "text-success" : "text-danger"
              }`}
            >
              ₹{balance}
            </h2>
          </div>
        </div>

      </div>

      {/* Transactions Table */}
      <Transactions />
    </div>
  );
};

export default Dashboard;
