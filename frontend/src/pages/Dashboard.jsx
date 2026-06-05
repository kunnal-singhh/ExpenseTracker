import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useExpense from "../context/expenseContext";
import { ChartSkeleton, EmptyState, StatCardSkeleton } from "../components/UiStates";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const fmt = (n) => "\u20b9" + Math.abs(n || 0).toLocaleString("en-IN");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const graphViews = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];
const graphRangeLabel = {
  daily: "Last 7 days",
  weekly: "Last 8 weeks",
  monthly: "Last 12 months",
  yearly: "Last 5 years",
};

const parseTransactionDate = (transaction) => {
  const source = transaction.createdAt || transaction.date;
  const parsed = new Date(source);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const parts = String(transaction.date || "").split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    const fallback = new Date(year, month - 1, day);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return new Date();
};

const dayKey = (date) => date.toLocaleDateString("en-CA");
const sameDay = (a, b) => (
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()
);
const transactionCategory = (transaction) => transaction.category || transaction.to || "Other";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="text-secondary mb-1" style={{ fontSize: 12 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mb-0 fw-semibold" style={{ color: p.color, fontSize: 13 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const buildTransactionGraphData = (transactions, graphView) => {
  const now = new Date();
  const buildPoint = (label, matches) => {
    const entries = transactions.filter((transaction) => matches(parseTransactionDate(transaction)));
    const pointIncome = entries.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const pointExpense = entries.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return {
      label,
      income: pointIncome,
      expense: pointExpense,
      net: pointIncome - pointExpense,
      count: entries.length,
    };
  };

  if (graphView === "daily") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      return buildPoint(date.toLocaleDateString("en-IN", { weekday: "short" }), (d) => sameDay(d, date));
    });
  }

  if (graphView === "weekly") {
    return Array.from({ length: 8 }, (_, index) => {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - ((7 - index) * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return buildPoint(`${start.getDate()} ${MONTHS[start.getMonth()]}`, (d) => d >= start && d <= end);
    });
  }

  if (graphView === "yearly") {
    return Array.from({ length: 5 }, (_, index) => {
      const year = now.getFullYear() - (4 - index);
      return buildPoint(String(year), (d) => d.getFullYear() === year);
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return buildPoint(`${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`, (d) => (
      d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
    ));
  });
};

const Dashboard = () => {
  const { transactions, user, transactionsLoading } = useExpense();
  const [graphView, setGraphView] = useState("monthly");

  const income = transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const balance = income + expense;
  const expenses = useMemo(() => transactions.filter((t) => t.amount < 0), [transactions]);

  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dateStr = d.toLocaleDateString("en-IN");
      const spent = transactions
        .filter((t) => t.amount < 0 && (t.date === dateStr || new Date(t.createdAt).toLocaleDateString("en-IN") === dateStr))
        .reduce((a, t) => a + Math.abs(t.amount), 0);
      days.push({ day: label, spent });
    }
    return days;
  }, [transactions]);

  const transactionGraphData = buildTransactionGraphData(transactions, graphView);

  const smartAnalytics = useMemo(() => {
    const categoryTotals = {};
    const dayTotals = WEEKDAYS.map((day) => ({ day, spent: 0, count: 0 }));
    const activeDays = new Set();
    let totalSpent = 0;

    expenses.forEach((transaction) => {
      const value = Math.abs(transaction.amount);
      const date = parseTransactionDate(transaction);
      const category = transactionCategory(transaction);
      categoryTotals[category] = (categoryTotals[category] || 0) + value;
      dayTotals[date.getDay()].spent += value;
      dayTotals[date.getDay()].count += 1;
      activeDays.add(dayKey(date));
      totalSpent += value;
    });

    const highestCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    const activeDay = [...dayTotals].sort((a, b) => b.spent - a.spent)[0];
    const averageDailySpend = activeDays.size > 0 ? Math.round(totalSpent / activeDays.size) : 0;

    return {
      highestCategory: highestCategory ? { name: highestCategory[0], value: highestCategory[1] } : null,
      activeDay,
      averageDailySpend,
    };
  }, [expenses]);

  const currentMonthStats = useMemo(() => {
    const now = new Date();
    let cmIncome = 0;
    let cmExpense = 0;
    transactions.forEach(t => {
      const d = parseTransactionDate(t);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        if (t.amount > 0) cmIncome += t.amount;
        else cmExpense += Math.abs(t.amount);
      }
    });
    return { income: cmIncome, expense: cmExpense, net: cmIncome - cmExpense };
  }, [transactions]);

  const currentPeriodStats = useMemo(() => {
    const period = user?.budgetPeriod || "monthly";
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (period === "daily") {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "weekly") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === "yearly") {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
    } else { // monthly
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    let pExpense = 0;
    transactions.forEach(t => {
      const d = parseTransactionDate(t);
      if (d >= startDate && d <= endDate && t.amount < 0) {
        pExpense += Math.abs(t.amount);
      }
    });
    return { expense: pExpense };
  }, [transactions, user?.budgetPeriod]);

  const pieData = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const category = transactionCategory(t);
      map[category] = (map[category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const savingsRate = currentMonthStats.income > 0 
    ? Math.round((currentMonthStats.net / currentMonthStats.income) * 100) 
    : 0;
  const recent = transactions;

  const stats = [
    { label: "Total income", value: fmt(income), color: "var(--app-success)", icon: "fa-circle-arrow-down", bg: "rgba(16,185,129,.12)" },
    { label: "Total expense", value: fmt(expense), color: "var(--app-danger)", icon: "fa-circle-arrow-up", bg: "rgba(239,68,68,.12)" },
    { label: "Net balance", value: fmt(balance), color: balance >= 0 ? "var(--app-success)" : "var(--app-danger)", icon: "fa-wallet", bg: "rgba(59,130,246,.12)" },
    { label: "Monthly savings rate", value: `${savingsRate}%`, color: "var(--app-warning)", icon: "fa-piggy-bank", bg: "rgba(245,158,11,.12)" },
  ];
  const hasTransactions = transactions.length > 0;
  const hasExpenses = expenses.length > 0;
  const hasTransactionGraphData = transactionGraphData.some((point) => point.count > 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
        <div>
          <h4 className="fw-semibold mb-0">{greeting()}, {user?.name?.split(" ")[0] || "there"}</h4>
          <small className="text-secondary">Here is your financial overview.</small>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/balance" className="btn btn-sm rounded-3 theme-chip">
            <i className="fa-solid fa-plus me-2" />
            Add Balance
          </Link>
          <Link to="/expense" className="btn btn-sm rounded-3 theme-chip">
            <i className="fa-solid fa-minus me-2" />
            Add Expense
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {transactionsLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="col-6 col-lg-3" key={index}>
              <StatCardSkeleton />
            </div>
          ))
        ) : (
          stats.map((s) => (
            <div className="col-6 col-lg-3" key={s.label}>
              <div className="theme-card p-3 h-100 metric-card">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-secondary" style={{ fontSize: 12 }}>{s.label}</span>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: s.bg }}>
                    <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 13 }} />
                  </div>
                </div>
                <div className="fw-semibold metric-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="theme-card p-3 p-md-4 mb-3">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Transaction graphs</p>
            <small className="text-secondary">{graphRangeLabel[graphView]}</small>
          </div>
          <div className="transaction-graph-tabs" role="tablist" aria-label="Dashboard transaction graph range">
            {graphViews.map((view) => (
              <button
                key={view.key}
                type="button"
                role="tab"
                aria-selected={graphView === view.key}
                className={`btn btn-sm theme-chip ${graphView === view.key ? "active" : ""}`}
                onClick={() => setGraphView(view.key)}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {transactionsLoading ? (
          <ChartSkeleton height={240} />
        ) : hasTransactionGraphData ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={transactionGraphData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardTransactionIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dashboardTransactionExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" />
              <XAxis dataKey="label" tick={{ fill: "var(--app-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--app-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${Math.round(v / 1000)}k` : `\u20b9${v}`)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#dashboardTransactionIncomeGrad)" activeDot={{ r: 5, fill: "#10b981", stroke: "var(--app-surface)", strokeWidth: 2 }} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#dashboardTransactionExpenseGrad)" activeDot={{ r: 5, fill: "#ef4444", stroke: "var(--app-surface)", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="fa-chart-column" title="No graph data yet" message="Add transactions to see daily, weekly, monthly, and yearly activity." />
        )}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-7">
          <div className="theme-card dashboard-expense-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Daily spending</p>
              <small className="text-secondary">Last 7 days</small>
            </div>
            {transactionsLoading ? <ChartSkeleton height={190} /> : <ResponsiveContainer width="100%" height={190}>
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDailySpendBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--app-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--app-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${v / 1000}k` : `\u20b9${v}`)} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--app-surface-3)" }} />
                <Bar dataKey="spent" name="Spent" fill="url(#colorDailySpendBar)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="theme-card p-3 p-md-4 h-100 d-flex flex-column">
            <div className="mb-4">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Financial Goals</p>
              <small className="text-secondary">Progress based on your settings</small>
            </div>
            {transactionsLoading ? (
               <ChartSkeleton height={170} />
            ) : (
              <div className="row g-3 flex-grow-1 align-items-center mt-1 pb-2">
                <div className="col-6 d-flex flex-column align-items-center">
                  <div className="fw-medium mb-3 text-capitalize" style={{ fontSize: 13, color: "var(--app-text)" }}>{user?.budgetPeriod || "Monthly"} Budget</div>
                  {user?.budgetAmount ? (() => {
                    const spent = currentPeriodStats.expense;
                    const limit = user.budgetAmount;
                    const pct = Math.min(100, Math.round((spent / limit) * 100));
                    const color = pct >= 100 ? "var(--app-danger)" : pct > 75 ? "var(--app-warning)" : "var(--app-success)";
                    const data = [
                      { name: "Spent", value: spent },
                      { name: "Remaining", value: Math.max(0, limit - spent) }
                    ];
                    return (
                      <div className="position-relative d-flex flex-column align-items-center">
                        <div style={{ width: 120, height: 120 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={data} innerRadius={42} outerRadius={56} dataKey="value" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                <Cell fill={color} />
                                <Cell fill="var(--app-surface-3)" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="position-absolute d-flex flex-column align-items-center justify-content-center" style={{ top: 0, left: 0, width: 120, height: 120, pointerEvents: "none" }}>
                          <span className="fw-bold" style={{ fontSize: 18, color }}>{pct}%</span>
                          <span className="text-secondary fw-medium" style={{ fontSize: 10 }}>Spent</span>
                        </div>
                        <div className="text-center mt-3">
                          <div className="fw-semibold" style={{ fontSize: 13, color: "var(--app-text)" }}>{fmt(spent)} <span className="fw-normal text-secondary" style={{ fontSize: 11 }}>/ {fmt(limit)}</span></div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: 120, width: 120, borderRadius: "50%", border: "4px solid var(--app-surface-3)" }}>
                       <div className="text-secondary" style={{ fontSize: 12 }}>Not set</div>
                    </div>
                  )}
                </div>

                <div className="col-6 d-flex flex-column align-items-center">
                  <div className="fw-medium mb-3" style={{ fontSize: 13, color: "var(--app-text)" }}>Savings Goal</div>
                  {user?.savingsGoal ? (() => {
                    const saved = Math.max(0, currentMonthStats.net);
                    const limit = user.savingsGoal;
                    const pct = Math.min(100, Math.round((saved / limit) * 100));
                    const data = [
                      { name: "Saved", value: saved },
                      { name: "Remaining", value: Math.max(0, limit - saved) }
                    ];
                    return (
                      <div className="position-relative d-flex flex-column align-items-center">
                        <div style={{ width: 120, height: 120 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={data} innerRadius={42} outerRadius={56} dataKey="value" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                                <Cell fill="var(--app-primary)" />
                                <Cell fill="var(--app-surface-3)" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="position-absolute d-flex flex-column align-items-center justify-content-center" style={{ top: 0, left: 0, width: 120, height: 120, pointerEvents: "none" }}>
                          <span className="fw-bold" style={{ fontSize: 18, color: "var(--app-primary)" }}>{pct}%</span>
                          <span className="text-secondary fw-medium" style={{ fontSize: 10 }}>Saved</span>
                        </div>
                        <div className="text-center mt-3">
                          <div className="fw-semibold" style={{ fontSize: 13, color: "var(--app-text)" }}>{fmt(saved)} <span className="fw-normal text-secondary" style={{ fontSize: 11 }}>/ {fmt(limit)}</span></div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ height: 120, width: 120, borderRadius: "50%", border: "4px solid var(--app-surface-3)" }}>
                       <div className="text-secondary" style={{ fontSize: 12 }}>Not set</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-3 mt-4 mb-3 flex-wrap">
        <div>
          <p className="theme-section-label mb-1">Smart analytics</p>
          <h5 className="fw-semibold mb-0">Behavior signals</h5>
        </div>
      </div>

      <div className="row g-3 mb-3">
        {transactionsLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div className="col-12 col-md-4" key={index}>
              <StatCardSkeleton />
            </div>
          ))
        ) : (
          [
            {
              label: "Highest expense category",
              value: smartAnalytics.highestCategory?.name || "No data",
              sub: smartAnalytics.highestCategory ? fmt(smartAnalytics.highestCategory.value) : "Add expenses to analyze",
              icon: "fa-crown",
              color: "var(--app-warning)",
            },
            {
              label: "Most active spending day",
              value: smartAnalytics.activeDay?.spent ? smartAnalytics.activeDay.day : "No data",
              sub: smartAnalytics.activeDay?.spent ? `${fmt(smartAnalytics.activeDay.spent)} across ${smartAnalytics.activeDay.count} entries` : "No spending day yet",
              icon: "fa-calendar-day",
              color: "var(--app-primary)",
            },
            {
              label: "Average daily spend",
              value: fmt(smartAnalytics.averageDailySpend),
              sub: "Across days with expense activity",
              icon: "fa-gauge-high",
              color: "var(--app-danger)",
            },
          ].map((item) => (
            <div className="col-12 col-md-4" key={item.label}>
              <div className="theme-card p-3 h-100 metric-card">
                <div className="d-flex align-items-center justify-content-between mb-3 gap-3">
                  <span className="text-secondary" style={{ fontSize: 12 }}>{item.label}</span>
                  <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, background: "var(--app-surface-3)" }}>
                    <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: 13 }} />
                  </div>
                </div>
                <div className="fw-semibold text-truncate" style={{ fontSize: 20 }}>{item.value}</div>
                <div className="text-secondary text-truncate" style={{ fontSize: 12 }}>{item.sub}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Top expenses</p>
              <small className="text-secondary">By category</small>
            </div>
            {transactionsLoading ? (
              <ChartSkeleton />
            ) : pieData.length === 0 ? (
              <EmptyState
                icon="fa-chart-pie"
                title={hasTransactions ? "No expenses yet" : "No spending data yet"}
                message="Record expenses to see your top categories here."
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard-expense-legend d-flex flex-column gap-1 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <span className="text-secondary text-truncate" style={{ fontSize: 12, maxWidth: 150 }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 12 }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="theme-card dashboard-recent-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Recent transactions</p>
              <Link to="/transactions" style={{ fontSize: 12, color: "var(--app-primary)", textDecoration: "none" }}>View all</Link>
            </div>
            {transactionsLoading ? (
              <div className="theme-card-muted p-2">
                <div className="skeleton-list">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="d-flex align-items-center gap-3 px-2 py-2">
                      <span className="skeleton-line rounded-3 flex-shrink-0" style={{ width: 34, height: 34 }} />
                      <div className="flex-grow-1">
                        <span className="skeleton-line mb-2" style={{ width: "48%", height: 12 }} />
                        <span className="skeleton-line" style={{ width: "30%", height: 10 }} />
                      </div>
                      <span className="skeleton-line" style={{ width: 62, height: 12 }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon="fa-receipt"
                title="No transactions yet"
                message="Add a balance or expense entry to start building your history."
              />
            ) : (
              <div className="dashboard-recent-list d-flex flex-column gap-2">
                {recent.map((t) => {
                  const isIncome = t.amount > 0;
                  return (
                    <div key={t._id || t.id} className="theme-card-muted d-flex align-items-center gap-3 px-3 py-2">
                      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 34, height: 34, background: isIncome ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.15)" }}>
                        <i className={`fa-solid ${isIncome ? "fa-circle-arrow-down" : "fa-circle-arrow-up"}`} style={{ color: isIncome ? "var(--app-success)" : "var(--app-danger)", fontSize: 12 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-truncate fw-semibold" style={{ fontSize: 13 }}>{t.to}</div>
                        <div className="text-secondary" style={{ fontSize: 11 }}>{isIncome ? "Income" : transactionCategory(t)} - {t.date}</div>
                      </div>
                      <div className="fw-semibold" style={{ fontSize: 13, color: isIncome ? "var(--app-success)" : "var(--app-danger)" }}>
                        {isIncome ? "+" : "-"}{fmt(t.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
