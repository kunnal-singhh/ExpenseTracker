/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { transactionAPI, authAPI, userAPI, setToken } from "../services/api";

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [authLoading, setAuthLoading]   = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError]               = useState(null);

  const fetchTransactions = useCallback(async (params = "") => {
    setTransactionsLoading(true);
    try {
      const data = await transactionAPI.getAll(params);
      setTransactions(data.transactions);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const addTransactions = useCallback(async (transactionData) => {
    const data = await transactionAPI.create(transactionData);
    if (data.success) {
      setTransactions((prev) => [data.transaction, ...prev]);
    }
    return data;
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await transactionAPI.delete(id);
    setTransactions((prev) => prev.filter((t) => t._id !== id && t.id !== id));
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      await fetchTransactions();
      return data;
    } finally {
      setAuthLoading(false);
    }
  }, [fetchTransactions]);

  const register = useCallback(async (name, email, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.register({ name, email, password });
      return data;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (email, code) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.verify({ email, code });
      setToken(data.token);
      setUser(data.user);
      await fetchTransactions();
      return data;
    } finally {
      setAuthLoading(false);
    }
  }, [fetchTransactions]);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error("Logout failed:", e);
    }
    setToken(null);
    setUser(null);
    setTransactions([]);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const data = await userAPI.updateProfile(profileData);
    if (data.success) {
      setUser((prev) => ({
        ...prev,
        ...profileData,
        ...data.user,
      }));
    }
    return data;
  }, []);

  const changeEmail = useCallback(async (email) => {
    const data = await userAPI.changeEmail({ email });
    if (data.success) {
      setUser((prev) => ({
        ...prev,
        email,
        ...data.user,
      }));
    }
    return data;
  }, []);

  const changePassword = useCallback(async (passwordData) => {
    return userAPI.changePassword(passwordData);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const refreshData = await authAPI.refreshToken();
        if (refreshData && refreshData.token) {
          setToken(refreshData.token);
          const data = await authAPI.getMe();
          setUser(data.user);
          await fetchTransactions();
        }
      } catch {
        // Not logged in or refresh failed
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchTransactions]);

  const value = useMemo(() => ({
    transactions, addTransactions, deleteTransaction,
    fetchTransactions, user, login, register, verifyOTP, logout,
    updateProfile, changeEmail, changePassword,
    loading, authLoading, transactionsLoading, error,
  }), [
    transactions, addTransactions, deleteTransaction,
    fetchTransactions, user, login, register, verifyOTP, logout,
    updateProfile, changeEmail, changePassword,
    loading, authLoading, transactionsLoading, error,
  ]);

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

export default function useExpense() {
  return useContext(ExpenseContext);
}
