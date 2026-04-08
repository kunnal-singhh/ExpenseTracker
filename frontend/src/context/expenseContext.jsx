// src/context/expenseContext.jsx
// Drop-in replacement — same API as before, but backed by MongoDB via REST API.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { transactionAPI, authAPI } from "../services/api";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [transactions, setTransactions]   = useState([]);
  const [user, setUser]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [authLoading, setAuthLoading]     = useState(false);
  const [error, setError]                 = useState(null);

  // ─── Restore session on mount ───────────────────────
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }
      try {
        const data = await authAPI.getMe();
        setUser(data.user);
        await fetchTransactions();
      } catch {
        // Token expired / invalid → clear it
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ─── Fetch all transactions from API ────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      const data = await transactionAPI.getAll();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // ─── Add a transaction (balance or expense) ─────────
  // Keeps the same signature your pages use: addTransactions({ to, amount })
  const addTransactions = async (trans) => {
    const data = await transactionAPI.create({ to: trans.to, amount: trans.amount });
    setTransactions((prev) => [data.transaction, ...prev]);
  };

  // ─── Delete a transaction ────────────────────────────
  const deleteTransaction = async (id) => {
    await transactionAPI.delete(id);
    setTransactions((prev) => prev.filter((t) => t._id !== id && t.id !== id));
  };

  // ─── Auth ─────────────────────────────────────────────
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      await fetchTransactions();
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.register({ name, email, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setTransactions([]);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setTransactions([]);
  };

  return (
    <ExpenseContext.Provider
      value={{
        transactions,
        addTransactions,
        deleteTransaction,
        fetchTransactions,
        user,
        login,
        register,
        logout,
        loading,
        authLoading,
        error,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export default function useExpense() {
  return useContext(ExpenseContext);
}
