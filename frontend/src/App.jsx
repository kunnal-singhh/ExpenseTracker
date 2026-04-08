// src/App.jsx — updated version with auth guard
// Replace your existing App.jsx with this

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AddBalance from "./pages/AddBalance";
import AddExpense from "./pages/AddExpense";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";
import Auth from "./pages/Auth";
import { ExpenseProvider } from "./context/expenseContext";
import AIAssistant from "./components/AIAssistant";
import useExpense from "./context/expenseContext";

// ─── Private Route Guard ───────────────────────────────
// Redirects to /login if the user is not authenticated
function PrivateRoute({ children }) {
  const { user, loading } = useExpense();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center bg-dark vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Auth />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="balance" element={<AddBalance />} />
          <Route path="expense" element={<AddExpense />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="settings" element={<Settings />} />
          <Route path="support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <AIAssistant />
    </>
  );
}

function App() {
  return (
    <ExpenseProvider>
      <AppRoutes />
    </ExpenseProvider>
  );
}

export default App;
