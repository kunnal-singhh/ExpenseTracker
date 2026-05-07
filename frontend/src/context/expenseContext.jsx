import { createContext, useContext, useState, useEffect } from "react";
import { transactionAPI, authAPI, userAPI } from "../services/api";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [authLoading, setAuthLoading]   = useState(false);
  const [error, setError]               = useState(null);

  // ── plain async fn, not useCallback ──────────────────
  const fetchTransactions = async () => {
    try {
      const data = await transactionAPI.getAll();
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }
      try {
        const data = await authAPI.getMe();
        setUser(data.user);
        await fetchTransactions(); // now works fine
      } catch {
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []); // eslint-disable-line

  const addTransactions = async (transactionData) => {
    const data = await transactionAPI.create(transactionData); // let it throw
    if (data.success) {
      setTransactions((prev) => [data.transaction, ...prev]);
    }
  };

  const deleteTransaction = async (id) => {
    await transactionAPI.delete(id);
    setTransactions((prev) => prev.filter((t) => t._id !== id && t.id !== id));
  };

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

  const updateProfile = async (profileData) => {
    const data = await userAPI.updateProfile(profileData);
    if (data.success) {
      setUser((prev) => ({
        ...prev,
        ...profileData,
        ...data.user,
      }));
    }
    return data;
  };

  const changeEmail = async (email) => {
    const data = await userAPI.changeEmail({ email });
    if (data.success) {
      setUser((prev) => ({
        ...prev,
        email,
        ...data.user,
      }));
    }
    return data;
  };

  const changePassword = async (passwordData) => {
    return userAPI.changePassword(passwordData);
  };

  return (
    <ExpenseContext.Provider value={{
      transactions, addTransactions, deleteTransaction,
      fetchTransactions, user, login, register, logout,
      updateProfile, changeEmail, changePassword,
      loading, authLoading, error,
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export default function useExpense() {
  return useContext(ExpenseContext);
}
