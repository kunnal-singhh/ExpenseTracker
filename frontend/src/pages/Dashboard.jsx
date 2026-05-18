import React, { useMemo } from "react";
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
  Line,
  LineChart,
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
const pct = (current, previous) => previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
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

const Dashboard = () => {
  const { transactions, user, transactionsLoading } = useExpense();

  const income = transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const balance = income + expense;
  const expenses = useMemo(() => transactions.filter((t) => t.amount < 0), [transactions]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const map = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      map[`${d.getFullYear()}-${d.getMonth()}`] = { month: MONTHS[d.getMonth()], income: 0, expense: 0 };
    }
    transactions.forEach((t) => {
      const d = new Date(t.createdAt || t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) return;
      if (t.amount > 0) map[key].income += t.amount;
      else map[key].expense += Math.abs(t.amount);
    });
    return Object.values(map);
  }, [transactions]);

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

  const weeklyTrendData = useMemo(() => {
    const map = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7));
      const label = `${start.getDate()} ${MONTHS[start.getMonth()]}`;
      map[dayKey(start)] = { week: label, spent: 0 };
    }

    expenses.forEach((transaction) => {
      const date = parseTransactionDate(transaction);
      const diffDays = Math.floor((now - date) / 86400000);
      if (diffDays < 0 || diffDays > 55) return;
      const bucketDate = new Date(now);
      bucketDate.setDate(now.getDate() - (Math.floor(diffDays / 7) * 7));
      const key = dayKey(bucketDate);
      if (map[key]) map[key].spent += Math.abs(transaction.amount);
    });

    return Object.values(map);
  }, [expenses]);

  const categoryGrowth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previous = new Date(currentYear, currentMonth - 1, 1);
    const map = {};

    expenses.forEach((transaction) => {
      const date = parseTransactionDate(transaction);
      const key = transactionCategory(transaction);
      map[key] ||= { name: key, current: 0, previous: 0 };
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        map[key].current += Math.abs(transaction.amount);
      }
      if (date.getMonth() === previous.getMonth() && date.getFullYear() === previous.getFullYear()) {
        map[key].previous += Math.abs(transaction.amount);
      }
    });

    return Object.values(map)
      .map((item) => ({ ...item, growth: pct(item.current, item.previous) }))
      .filter((item) => item.current > 0 || item.previous > 0)
      .sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth))
      .slice(0, 5);
  }, [expenses]);

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
      weekdayData: dayTotals,
    };
  }, [expenses]);

  const heatmapData = useMemo(() => {
    const totals = {};
    expenses.forEach((transaction) => {
      const date = parseTransactionDate(transaction);
      totals[dayKey(date)] = (totals[dayKey(date)] || 0) + Math.abs(transaction.amount);
    });

    const cells = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const value = totals[dayKey(date)] || 0;
      cells.push({
        key: dayKey(date),
        label: `${date.getDate()} ${MONTHS[date.getMonth()]}`,
        value,
      });
    }
    const max = Math.max(...cells.map((cell) => cell.value), 1);
    return cells.map((cell) => ({ ...cell, intensity: cell.value / max }));
  }, [expenses]);

  const pieData = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const category = transactionCategory(t);
      map[category] = (map[category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const savingsRate = income > 0 ? Math.round(((income - Math.abs(expense)) / income) * 100) : 0;
  const recent = transactions.slice(0, 5);

  const stats = [
    { label: "Total income", value: fmt(income), color: "var(--app-success)", icon: "fa-circle-arrow-down", bg: "rgba(16,185,129,.12)" },
    { label: "Total expense", value: fmt(expense), color: "var(--app-danger)", icon: "fa-circle-arrow-up", bg: "rgba(239,68,68,.12)" },
    { label: "Net balance", value: fmt(balance), color: balance >= 0 ? "var(--app-success)" : "var(--app-danger)", icon: "fa-wallet", bg: "rgba(59,130,246,.12)" },
    { label: "Savings rate", value: `${savingsRate}%`, color: "var(--app-warning)", icon: "fa-piggy-bank", bg: "rgba(245,158,11,.12)" },
  ];
  const hasTransactions = transactions.length > 0;
  const hasExpenses = expenses.length > 0;

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

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-7">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 gap-3 flex-wrap">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Income vs Expense</p>
                <small className="text-secondary">Last 6 months</small>
              </div>
              <div className="d-flex gap-3">
                <span style={{ fontSize: 11, color: "var(--app-success)" }}>Income</span>
                <span style={{ fontSize: 11, color: "var(--app-danger)" }}>Expense</span>
              </div>
            </div>
            {transactionsLoading ? <ChartSkeleton /> : <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.26} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" />
                <XAxis dataKey="month" tick={{ fill: "#7b8794", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7b8794", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${v / 1000}k` : `\u20b9${v}`)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>}
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Daily spending</p>
              <small className="text-secondary">Last 7 days</small>
            </div>
            {transactionsLoading ? <ChartSkeleton /> : <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#7b8794", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7b8794", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${v / 1000}k` : `\u20b9${v}`)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="spent" name="Spent" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-3 mt-4 mb-3 flex-wrap">
        <div>
          <p className="theme-section-label mb-1">Spending trends</p>
          <h5 className="fw-semibold mb-0">Where your money is moving</h5>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Weekly trends</p>
              <small className="text-secondary">Last 8 weeks of expenses</small>
            </div>
            {transactionsLoading ? <ChartSkeleton /> : hasExpenses ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weeklyTrendData} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#7b8794", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7b8794", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${v / 1000}k` : `\u20b9${v}`)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="spent" name="Spent" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="fa-chart-line" title="No weekly trend yet" message="Add expenses across days to see spending momentum." />
            )}
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Category growth</p>
              <small className="text-secondary">This month compared with last month</small>
            </div>
            {transactionsLoading ? <ChartSkeleton /> : categoryGrowth.length === 0 ? (
              <EmptyState icon="fa-layer-group" title="No category growth yet" message="Record this month and last month expenses for comparison." />
            ) : (
              <div className="d-flex flex-column gap-3">
                {categoryGrowth.map((category) => {
                  const up = category.growth >= 0;
                  const maxValue = Math.max(category.current, category.previous, 1);
                  return (
                    <div key={category.name} className="analytics-row">
                      <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                        <span className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{category.name}</span>
                        <span className={up ? "trend-up" : "trend-down"}>{up ? "+" : ""}{category.growth}%</span>
                      </div>
                      <div className="comparison-bars">
                        <span style={{ width: `${Math.max((category.previous / maxValue) * 100, 4)}%` }} />
                        <span style={{ width: `${Math.max((category.current / maxValue) * 100, 4)}%` }} />
                      </div>
                      <div className="d-flex justify-content-between text-secondary mt-1" style={{ fontSize: 11 }}>
                        <span>Last {fmt(category.previous)}</span>
                        <span>Now {fmt(category.current)}</span>
                      </div>
                    </div>
                  );
                })}
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

      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-5">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Spending heatmap</p>
              <small className="text-secondary">Last 35 days</small>
            </div>
            {transactionsLoading ? <ChartSkeleton height={170} /> : hasExpenses ? (
              <>
                <div className="spending-heatmap" aria-label="Spending heatmap">
                  {heatmapData.map((cell) => (
                    <div
                      key={cell.key}
                      className="heatmap-cell"
                      title={`${cell.label}: ${fmt(cell.value)}`}
                      style={{ "--heat-bg": `rgba(59, 130, 246, ${0.16 + cell.intensity * 0.72})` }}
                    />
                  ))}
                </div>
                <div className="d-flex justify-content-between text-secondary mt-3" style={{ fontSize: 11 }}>
                  <span>Lower spend</span>
                  <span>Higher spend</span>
                </div>
              </>
            ) : (
              <EmptyState icon="fa-table-cells" title="No heatmap yet" message="Expense entries will light up your spending calendar." />
            )}
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Spending by weekday</p>
              <small className="text-secondary">Which days usually cost more</small>
            </div>
            {transactionsLoading ? <ChartSkeleton height={170} /> : hasExpenses ? (
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={smartAnalytics.weekdayData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "#7b8794", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7b8794", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${v / 1000}k` : `\u20b9${v}`)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="spent" name="Spent" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon="fa-calendar-week" title="No weekday pattern yet" message="Add expenses on different days to reveal spending habits." />
            )}
          </div>
        </div>
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
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="d-flex flex-column gap-1 mt-2">
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
          <div className="theme-card p-3 p-md-4 h-100">
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
              <div className="d-flex flex-column gap-2">
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
