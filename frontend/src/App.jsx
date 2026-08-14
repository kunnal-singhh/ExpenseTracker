import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import { ExpenseProvider } from "./context/expenseContext";
import AIAssistant from "./components/AIAssistant";
import useExpense from "./context/expenseContext";
import { ToastProvider } from "./components/ToastProvider";
import AdminRoute from "./components/AdminRoute";

// Lazy-loaded pages for code splitting & initial bundle optimization
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddBalance = lazy(() => import("./pages/AddBalance"));
const AddExpense = lazy(() => import("./pages/AddExpense"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Settings = lazy(() => import("./pages/Settings"));
const Support = lazy(() => import("./pages/Support"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: "300px" }}>
    <div className="spinner-border text-primary" role="status" style={{ width: 28, height: 28 }} />
  </div>
);

function PrivateRoute({ children }) {
  const { user, loading } = useExpense();

  if (loading) {
    return (
      <div className="app-main d-flex justify-content-center align-items-center vh-100">
        <div className="theme-card p-4 d-flex align-items-center gap-3">
          <div className="spinner-border text-primary" role="status" />
          <span className="text-secondary">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  useEffect(() => {
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-bs-theme", theme);
  }, []);

  return (
    <>
      <Suspense fallback={<PageFallback />}>
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
            <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      <AIAssistant />
    </>
  );
}

function App() {
  return (
    <ExpenseProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </ExpenseProvider>
  );
}

export default App;
