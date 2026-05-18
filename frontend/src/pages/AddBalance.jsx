import React, { useEffect, useMemo, useState } from "react";
import useExpense from "../context/expenseContext";
import { useToast } from "../components/useToast";
import { ButtonSpinner } from "../components/UiStates";
import { transactionAPI } from "../services/api";
import { INCOME_CATEGORIES, detectIncomeCategory } from "../utils/categoryUtils";

const QUICK_AMOUNTS = [500, 1000, 5000, 10000];
const fmt = (n) => "\u20b9" + Math.abs(n || 0).toLocaleString("en-IN");

const AddBalance = () => {
  const { transactions, addTransactions } = useExpense();
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [aiCategory, setAiCategory] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiStatus, setAiStatus] = useState("idle");
  const [loading, setLoading] = useState(false);

  const balance = transactions.reduce((a, t) => a + t.amount, 0);
  const detectedCategory = useMemo(() => detectIncomeCategory(source), [source]);
  const selectedCategory = manualCategory || aiCategory || detectedCategory;

  useEffect(() => {
    const description = source.trim();
    if (!description || manualCategory || detectedCategory !== "Other") {
      setAiCategory("");
      setAiMessage("");
      setAiStatus("idle");
      return;
    }

    let cancelled = false;
    setAiStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const data = await transactionAPI.categorize({ description, type: "income" });
        if (cancelled) return;
        setAiCategory(data.category && data.category !== "Other" ? data.category : "");
        setAiMessage(data.error || "");
        setAiStatus(data.source === "ai" ? "matched" : data.source === "ai_error" ? "error" : "idle");
      } catch {
        if (!cancelled) {
          setAiMessage("Could not reach AI categorization.");
          setAiStatus("error");
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [source, manualCategory, detectedCategory]);

  const incomeThisMonth = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const date = new Date(t.createdAt || t.date);
        return t.amount > 0 && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const amountValue = Number(amount);
  const canSubmit = source.trim() && amountValue > 0 && !loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await addTransactions({ to: source.trim(), amount: amountValue, category: selectedCategory });
      showToast("Balance updated successfully.", "success");
      setSource("");
      setAmount("");
      setManualCategory("");
      setAiCategory("");
      setAiMessage("");
      setAiStatus("idle");
    } catch (err) {
      showToast(err.message || "Could not add balance.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, background: "rgba(16,185,129,.14)" }}>
              <i className="fa-solid fa-circle-plus" style={{ color: "var(--app-success)", fontSize: 14 }} />
            </div>
            <h4 className="fw-semibold mb-0">Add balance</h4>
          </div>
          <small className="text-secondary">Record income and keep your available balance current.</small>
        </div>

        <div className="theme-card px-3 py-2" style={{ minWidth: 190 }}>
          <div className="text-secondary" style={{ fontSize: 11 }}>CURRENT BALANCE</div>
          <div className="fw-semibold" style={{ color: balance >= 0 ? "var(--app-success)" : "var(--app-danger)", fontSize: 22 }}>{fmt(balance)}</div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Deposit details</p>
                <small className="text-secondary">Add source information for a clean history.</small>
              </div>
              <span className="rounded-3 px-2 py-1" style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)", fontSize: 11 }}>Credit entry</span>
            </div>

            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>SOURCE NAME</label>
                <input
                  type="text"
                  className="form-control theme-input py-3"
                  placeholder="e.g. Monthly salary"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value);
                    setManualCategory("");
                    setAiCategory("");
                    setAiMessage("");
                  }}
                />
                {source.trim() && (
                  <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                    <span className="text-secondary" style={{ fontSize: 11, fontWeight: 700 }}>SMART SOURCE</span>
                    <span
                      className="rounded-3 px-2 py-1 d-inline-flex align-items-center gap-2"
                      style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)", fontSize: 12 }}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 11 }} />
                      {aiStatus === "checking" ? "Checking AI..." : aiStatus === "error" ? "AI unavailable" : selectedCategory}
                    </span>
                    {aiStatus === "matched" && <span className="text-secondary" style={{ fontSize: 11 }}>AI fallback</span>}
                    {aiStatus === "error" && <span className="text-secondary" style={{ fontSize: 11 }} title={aiMessage}>Using Other</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>AMOUNT</label>
                <div className="input-group">
                  <span className="input-group-text theme-input border-end-0">&#8377;</span>
                  <input type="number" min="1" className="form-control theme-input py-3 border-start-0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>

              <div>
                <div className="theme-section-label mb-2">Common sources</div>
                <div className="d-flex flex-wrap gap-2">
                  {INCOME_CATEGORIES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setManualCategory(item);
                        if (!source.trim()) setSource(item);
                      }}
                      className={`btn btn-sm rounded-3 theme-chip ${selectedCategory === item ? "active" : ""}`}
                      style={{ fontSize: 12 }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="theme-section-label mb-2">Quick amounts</div>
                <div className="d-flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((quickAmount) => (
                    <button key={quickAmount} type="button" onClick={() => setAmount(String(quickAmount))} className="btn btn-sm rounded-3 theme-chip" style={{ fontSize: 12 }}>+{fmt(quickAmount)}</button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={!canSubmit} className="btn fw-semibold py-3 mt-2 w-100" style={{ background: canSubmit ? "var(--app-success)" : "var(--app-surface-3)", color: canSubmit ? "#fff" : "var(--app-muted)", borderRadius: 8, border: "none", fontSize: 14 }}>
                {loading ? <ButtonSpinner label="Processing..." /> : "Add to Balance"}
              </button>
            </form>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="d-flex flex-column gap-3 h-100">
            <div className="theme-card p-3 p-md-4">
              <p className="fw-semibold mb-3" style={{ fontSize: 14 }}>Deposit preview</p>
              <div className="theme-card-muted d-flex align-items-center gap-3 p-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 42, height: 42, background: "rgba(16,185,129,.14)" }}>
                  <i className="fa-solid fa-arrow-down" style={{ color: "var(--app-success)", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-truncate fw-semibold" style={{ fontSize: 14 }}>{source || "Income source"}</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>{source.trim() ? `${selectedCategory} - credited to available balance` : "Credited to available balance"}</div>
                </div>
                <div className="fw-semibold" style={{ color: "var(--app-success)", fontSize: 14 }}>+{fmt(amountValue)}</div>
              </div>
            </div>

            <div className="theme-card p-3 p-md-4 flex-grow-1">
              <p className="fw-semibold mb-3" style={{ fontSize: 14 }}>Monthly summary</p>
              <div className="theme-card-muted p-3">
                <div className="text-secondary" style={{ fontSize: 12 }}>Income added this month</div>
                <div className="fw-semibold mt-1" style={{ color: "var(--app-success)", fontSize: 26 }}>{fmt(incomeThisMonth)}</div>
              </div>
              <div className="theme-card-muted p-3 mt-3">
                <div className="text-secondary" style={{ fontSize: 12 }}>Projected balance after deposit</div>
                <div className="fw-semibold mt-1" style={{ fontSize: 22 }}>{fmt(balance + amountValue)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBalance;
