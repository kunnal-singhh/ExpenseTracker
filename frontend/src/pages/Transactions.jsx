import { useMemo, useState } from "react";
import useExpense from "../context/expenseContext";

const fmt = (n) => "\u20b9" + Math.abs(n || 0).toLocaleString("en-IN");

const Transactions = () => {
  const { transactions, deleteTransaction } = useExpense();
  const [filterType, setFilterType] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === "income") return t.amount > 0;
    if (filterType === "expense") return t.amount < 0;
    return true;
  });

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense, count: transactions.length };
  }, [transactions]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    setDeleting(id);
    try {
      await deleteTransaction(id);
    } catch (err) {
      alert(err.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
        <div>
          <h4 className="fw-semibold mb-0">Transaction history</h4>
          <small className="text-secondary">Manage, filter, and audit your account activity.</small>
        </div>
        <select className="form-select theme-select" style={{ width: 160, fontSize: 13 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Activity</option>
          <option value="income">Income Only</option>
          <option value="expense">Expenses Only</option>
        </select>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-4">
          <div className="theme-card p-3 h-100">
            <div className="text-secondary" style={{ fontSize: 12 }}>Records</div>
            <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{totals.count}</div>
          </div>
        </div>
        <div className="col-6 col-lg-4">
          <div className="theme-card p-3 h-100">
            <div className="text-secondary" style={{ fontSize: 12 }}>Income</div>
            <div className="fw-semibold mt-1" style={{ fontSize: 22, color: "var(--app-success)" }}>{fmt(totals.income)}</div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="theme-card p-3 h-100">
            <div className="text-secondary" style={{ fontSize: 12 }}>Expenses</div>
            <div className="fw-semibold mt-1" style={{ fontSize: 22, color: "var(--app-danger)" }}>{fmt(totals.expense)}</div>
          </div>
        </div>
      </div>

      <div className="theme-card p-2">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-5">
            <i className="fa-solid fa-receipt text-secondary mb-3" style={{ fontSize: "2rem", opacity: 0.35 }} />
            <p className="text-secondary mb-0" style={{ fontSize: 14 }}>No transactions found in this category.</p>
          </div>
        ) : (
          <div className="d-flex flex-column">
            {filteredTransactions.map((t) => {
              const isIncome = t.amount > 0;
              const id = t._id || t.id;
              return (
                <div key={id} className="theme-row d-flex align-items-center gap-3 px-3 py-3">
                  <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 42, height: 42, background: isIncome ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)" }}>
                    <i className={`fa-solid ${isIncome ? "fa-circle-arrow-down" : "fa-circle-arrow-up"}`} style={{ color: isIncome ? "var(--app-success)" : "var(--app-danger)", fontSize: 16 }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw-semibold text-truncate" style={{ fontSize: 14 }}>{t.to}</div>
                    <div className="text-secondary" style={{ fontSize: 11 }}>{t.date} {t.time ? `- ${t.time}` : ""}</div>
                  </div>

                  <div className="text-end">
                    <div className="fw-semibold" style={{ fontSize: 15, color: isIncome ? "var(--app-success)" : "var(--app-danger)" }}>{isIncome ? "+" : "-"}{fmt(t.amount)}</div>
                    <div className="text-secondary" style={{ fontSize: 10 }}>{isIncome ? "Credit" : "Debit"}</div>
                  </div>

                  <button className="btn btn-link p-2 border-0" title="Delete transaction" onClick={() => handleDelete(id)} disabled={deleting === id}>
                    {deleting === id ? <span className="spinner-border spinner-border-sm text-secondary" /> : <i className="fa-solid fa-trash-can text-secondary" style={{ fontSize: 14, opacity: 0.55 }} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
