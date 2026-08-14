import { useEffect, useMemo, useState } from "react";
import useExpense from "../context/expenseContext";
import { useToast } from "../components/useToast";
import { EmptyState, TransactionSkeleton } from "../components/UiStates";

const fmt = (n) => "\u20b9" + Math.abs(n || 0).toLocaleString("en-IN");
const transactionCategory = (transaction) => transaction.category || transaction.to || "Other";
const transactionId = (transaction) => transaction._id || transaction.id;
const displayValue = (value) => value || "Not available";

const Transactions = () => {
  const { transactions, deleteTransaction, transactionsLoading } = useExpense();
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSelectedTransaction(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredTransactions = useMemo(() => transactions.filter((t) => {
    if (filterType === "income") return t.amount > 0;
    if (filterType === "expense") return t.amount < 0;
    return true;
  }), [transactions, filterType]);

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
      if (selectedTransaction && transactionId(selectedTransaction) === id) {
        setSelectedTransaction(null);
      }
      showToast("Transaction deleted.", "success");
    } catch (err) {
      showToast(err.message || "Failed to delete transaction.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const handleExportCSV = () => {
    setExportingCSV(true);
    try {
      const headers = ["Date", "Time", "Type", "Category", "Description", "Amount"];
      const rows = filteredTransactions.map((t) => {
        const isIncome = t.amount > 0;
        const type = isIncome ? "Income" : "Expense";
        const amount = isIncome ? t.amount : Math.abs(t.amount);
        const desc = t.to ? `"${String(t.to).replace(/"/g, '""')}"` : '""';
        
        const dateVal = t.date || (t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "");
        const timeVal = t.time || (t.createdAt ? new Date(t.createdAt).toLocaleTimeString("en-IN") : "");
        
        const safeDate = `"${dateVal}"`;
        const safeTime = `"${timeVal}"`;
        const safeType = `"${type}"`;
        const safeCategory = `"${(t.category || "Other").replace(/"/g, '""')}"`;
        
        return [safeDate, safeTime, safeType, safeCategory, desc, amount].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transactions.csv";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      
      showToast("CSV exported successfully.", "success");
    } catch {
      showToast("Failed to export CSV.", "error");
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.text("Transaction History", 14, 15);
      
      const tableData = filteredTransactions.map((t) => {
        const isIncome = t.amount > 0;
        const type = isIncome ? "Income" : "Expense";
        const amount = isIncome ? t.amount : Math.abs(t.amount);
        
        const dateVal = t.date || (t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "");
        const timeVal = t.time || (t.createdAt ? new Date(t.createdAt).toLocaleTimeString("en-IN") : "");
        
        const pdfAmount = "Rs. " + Math.abs(amount || 0).toLocaleString("en-IN");
        
        return [dateVal, timeVal, type, t.category || "Other", t.to || "", pdfAmount];
      });

      autoTable(doc, {
        head: [["Date", "Time", "Type", "Category", "Description", "Amount"]],
        body: tableData,
        startY: 20,
        theme: 'striped',
      });

      doc.save("transactions.pdf");
      showToast("PDF exported successfully.", "success");
    } catch {
      showToast("Failed to export PDF.", "error");
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4 flex-wrap">
        <div>
          <h4 className="fw-semibold mb-0">Transaction history</h4>
          <small className="text-secondary">Manage, filter, and audit your account activity.</small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <div className="dropdown">
            <button 
              className="btn theme-chip border d-flex align-items-center justify-content-center dropdown-toggle" 
              type="button" 
              data-bs-toggle="dropdown" 
              aria-expanded="false" 
              style={{ fontSize: 13, borderColor: "var(--app-border-soft)", height: "100%" }}
              disabled={exportingCSV || exportingPDF || filteredTransactions.length === 0}
            >
              {(exportingCSV || exportingPDF) ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="fa-solid fa-download me-2" />}
              Export
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow border" style={{ fontSize: 13, borderColor: "var(--app-border-soft)" }}>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={handleExportCSV}>
                  <i className="fa-solid fa-file-csv" style={{ width: 16 }}></i> Export as CSV
                </button>
              </li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={handleExportPDF}>
                  <i className="fa-solid fa-file-pdf text-danger" style={{ width: 16 }}></i> Export as PDF
                </button>
              </li>
            </ul>
          </div>
          <select className="form-select theme-select" style={{ width: 160, fontSize: 13 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Activity</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>
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
        {transactionsLoading ? (
          <TransactionSkeleton rows={5} />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={filterType === "income" ? "fa-circle-arrow-down" : filterType === "expense" ? "fa-circle-arrow-up" : "fa-receipt"}
            title="No transactions found"
            message="Try another filter or add a new balance or expense entry."
          />
        ) : (
          <div className="d-flex flex-column">
            {filteredTransactions.map((t) => {
              const isIncome = t.amount > 0;
              const id = t._id || t.id;
              return (
                <div
                  key={id}
                  className="theme-row transaction-row d-flex align-items-center gap-3 px-3 py-3"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTransaction(t)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedTransaction(t);
                    }
                  }}
                >
                  <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 42, height: 42, background: isIncome ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)" }}>
                    <i className={`fa-solid ${isIncome ? "fa-circle-arrow-down" : "fa-circle-arrow-up"}`} style={{ color: isIncome ? "var(--app-success)" : "var(--app-danger)", fontSize: 16 }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fw-semibold text-truncate" style={{ fontSize: 14 }}>{t.to}</div>
                    <div className="text-secondary" style={{ fontSize: 11 }}>{isIncome ? "Income" : transactionCategory(t)} - {t.date} {t.time ? `- ${t.time}` : ""}</div>
                  </div>

                  <div className="text-end">
                    <div className="fw-semibold" style={{ fontSize: 15, color: isIncome ? "var(--app-success)" : "var(--app-danger)" }}>{isIncome ? "+" : "-"}{fmt(t.amount)}</div>
                    <div className="text-secondary" style={{ fontSize: 10 }}>{isIncome ? "Credit" : "Debit"}</div>
                  </div>

                  <button
                    className="btn btn-link p-2 border-0"
                    title="Delete transaction"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(id);
                    }}
                    disabled={deleting === id}
                  >
                    {deleting === id ? <span className="spinner-border spinner-border-sm text-secondary" /> : <i className="fa-solid fa-trash-can text-secondary" style={{ fontSize: 14, opacity: 0.55 }} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div className="transaction-detail-backdrop" role="presentation" onClick={() => setSelectedTransaction(null)}>
          <div className="transaction-detail-card theme-card" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" onClick={(event) => event.stopPropagation()}>
            {(() => {
              const t = selectedTransaction;
              const isIncome = t.amount > 0;
              const id = transactionId(t);
              const category = transactionCategory(t);
              return (
                <>
                  <div className="d-flex align-items-start justify-content-between gap-3 p-3 p-md-4 border-bottom" style={{ borderColor: "var(--app-border-soft)" }}>
                    <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 46, height: 46, background: isIncome ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)" }}>
                        <i className={`fa-solid ${isIncome ? "fa-circle-arrow-down" : "fa-circle-arrow-up"}`} style={{ color: isIncome ? "var(--app-success)" : "var(--app-danger)", fontSize: 18 }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h5 id="transaction-detail-title" className="fw-semibold mb-1 text-truncate">{displayValue(t.to)}</h5>
                        <small className="text-secondary">{isIncome ? "Income" : "Expense"} transaction</small>
                      </div>
                    </div>
                    <button type="button" className="btn btn-link border-0 p-1 text-secondary" aria-label="Close details" onClick={() => setSelectedTransaction(null)}>
                      <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
                    </button>
                  </div>

                  <div className="p-3 p-md-4">
                    <div className="transaction-amount-card mb-3" style={{ borderColor: isIncome ? "rgba(16,185,129,.28)" : "rgba(239,68,68,.28)" }}>
                      <span className="text-secondary">Amount</span>
                      <strong style={{ color: isIncome ? "var(--app-success)" : "var(--app-danger)" }}>{isIncome ? "+" : "-"}{fmt(t.amount)}</strong>
                    </div>

                    <div className="transaction-detail-grid">
                      <div className="transaction-detail-item">
                        <span>Type</span>
                        <strong>{isIncome ? "Credit" : "Debit"}</strong>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Category</span>
                        <strong>{displayValue(category)}</strong>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Date</span>
                        <strong>{displayValue(t.date)}</strong>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Time</span>
                        <strong>{displayValue(t.time)}</strong>
                      </div>
                      <div className="transaction-detail-item">
                        <span>Source / Merchant</span>
                        <strong>{displayValue(t.to)}</strong>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button type="button" className="btn theme-chip flex-grow-1 py-2" onClick={() => setSelectedTransaction(null)}>
                        Close
                      </button>
                      <button type="button" className="btn flex-grow-1 py-2" style={{ background: "rgba(239,68,68,.12)", color: "var(--app-danger)", border: "1px solid rgba(239,68,68,.28)" }} onClick={() => handleDelete(id)} disabled={deleting === id}>
                        {deleting === id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
