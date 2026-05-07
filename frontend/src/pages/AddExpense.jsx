import React, { useMemo, useState } from "react";
import useExpense from "../context/expenseContext";

const QUICK_AMOUNTS = [250, 500, 1000, 2500];
const CATEGORIES = ["Food", "Rent", "Travel", "Shopping", "Bills", "Health"];

const fmt = (n) => "\u20b9" + Math.abs(n || 0).toLocaleString("en-IN");

const AddExpense = () => {
  const { transactions, addTransactions } = useExpense();
  const [amount, setAmount] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const balance = transactions.reduce((a, t) => a + t.amount, 0);
  const amountValue = Number(amount);
  const isOverLimit = amountValue > balance;
  const canSubmit = to.trim() && amountValue > 0 && !isOverLimit && !loading;

  const monthlyExpense = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const date = new Date(t.createdAt || t.date);
        return (
          t.amount < 0 &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions]);

  const recentExpenses = useMemo(
    () => transactions.filter((t) => t.amount < 0).slice(0, 4),
    [transactions]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await addTransactions({ to: to.trim(), amount: -amountValue });
      setSuccess(true);
      setTo("");
      setAmount("");
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center"
              style={{ width: 34, height: 34, background: "rgba(239,68,68,.14)" }}
            >
              <i className="fa-solid fa-circle-minus" style={{ color: "#ef4444", fontSize: 14 }} />
            </div>
            <h4 className="fw-semibold mb-0">Record expense</h4>
          </div>
          <small className="text-secondary">Log outgoing payments and keep your balance accurate.</small>
        </div>

        <div className="theme-card px-3 py-2" style={{ minWidth: 180 }}>
          <div className="text-secondary" style={{ fontSize: 11 }}>AVAILABLE BALANCE</div>
          <div className="fw-semibold" style={{ color: balance > 0 ? "var(--app-success)" : "var(--app-danger)", fontSize: 22 }}>
            {fmt(balance)}
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Expense details</p>
                <small className="text-secondary">Enter the recipient, category, or merchant.</small>
              </div>
              <span className="rounded-3 px-2 py-1" style={{ background: "rgba(239,68,68,.12)", color: "#ef4444", fontSize: 11 }}>
                Debit entry
              </span>
            </div>

            {success && (
              <div className="rounded-3 py-2 px-3 mb-3" style={{ background: "rgba(16,185,129,.12)", color: "#10b981", fontSize: 13 }}>
                Expense recorded successfully.
              </div>
            )}

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>RECIPIENT / CATEGORY</label>
                <input
                  type="text"
                  className="form-control theme-input py-3"
                  style={{ fontSize: 14 }}
                  placeholder="e.g. Grocery, Rent, Uber"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <label className="text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>AMOUNT</label>
                  {isOverLimit && <span style={{ color: "#ef4444", fontSize: 11 }}>Amount exceeds balance</span>}
                </div>
                <div className="input-group">
                  <span className="input-group-text theme-input border-end-0 text-secondary">&#8377;</span>
                  <input
                    type="number"
                    min="1"
                    className="form-control theme-input py-3 border-start-0"
                    style={{ fontSize: 14 }}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>QUICK CATEGORIES</div>
                <div className="d-flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setTo(category)}
                      className={`btn btn-sm rounded-3 theme-chip ${to === category ? "active" : ""}`}
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>QUICK AMOUNTS</div>
                <div className="d-flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      type="button"
                      onClick={() => setAmount(String(quickAmount))}
                      className="btn btn-sm rounded-3 theme-chip"
                      style={{ fontSize: 12 }}
                    >
                      {fmt(quickAmount)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="btn fw-semibold py-3 mt-2 w-100"
                style={{
                  background: canSubmit ? "var(--app-danger)" : "var(--app-surface-3)",
                  color: canSubmit ? "#fff" : "var(--app-muted)",
                  borderRadius: 8,
                  fontSize: 14,
                  border: "none",
                }}
              >
                {loading ? "Recording..." : "Record Expense"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="d-flex flex-column gap-3 h-100">
            <div className="theme-card p-3 p-md-4">
              <p className="fw-semibold mb-3" style={{ fontSize: 14 }}>Transaction preview</p>
              <div className="theme-card-muted d-flex align-items-center gap-3 p-3">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 42, height: 42, background: "rgba(239,68,68,.14)" }}
                >
                  <i className="fa-solid fa-arrow-up" style={{ color: "#ef4444", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-truncate fw-semibold" style={{ fontSize: 14 }}>{to || "Expense category"}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>Debited from available balance</div>
                </div>
                <div className="fw-semibold" style={{ color: "#ef4444", fontSize: 14 }}>
                  -{fmt(amountValue)}
                </div>
              </div>
            </div>

            <div className="theme-card p-3 p-md-4 flex-grow-1">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Spending context</p>
                  <small className="text-secondary">This month and recent expenses</small>
                </div>
                <div className="fw-semibold" style={{ color: "#ef4444", fontSize: 14 }}>{fmt(monthlyExpense)}</div>
              </div>

              {recentExpenses.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center text-secondary" style={{ height: 156, fontSize: 13 }}>
                  No expenses recorded yet
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {recentExpenses.map((expense) => (
                    <div key={expense._id || expense.id} className="theme-card-muted d-flex align-items-center gap-3 px-3 py-2">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: 34, height: 34, background: "rgba(239,68,68,.14)" }}
                      >
                        <i className="fa-solid fa-circle-arrow-up" style={{ color: "#ef4444", fontSize: 12 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-truncate fw-semibold" style={{ fontSize: 13 }}>{expense.to}</div>
                        <div className="text-secondary" style={{ fontSize: 11 }}>{expense.date}</div>
                      </div>
                      <div className="fw-semibold" style={{ color: "#ef4444", fontSize: 13 }}>-{fmt(expense.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
