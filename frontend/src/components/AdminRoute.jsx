import React from 'react';
import { Navigate } from 'react-router-dom';
import useExpense from '../context/expenseContext';

export default function AdminRoute({ children }) {
  const { user, loading } = useExpense();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;
  return children;
}
