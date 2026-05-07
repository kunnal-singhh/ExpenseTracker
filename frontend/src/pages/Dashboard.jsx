import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import useExpense from "../context/expenseContext";
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
const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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
  const { transactions, user } = useExpense();

  const income = transactions.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const expense = transactions.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);
  const balance = income + expense;

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

  const pieData = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      map[t.to] = (map[t.to] || 0) + Math.abs(t.amount);
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
        {stats.map((s) => (
          <div className="col-6 col-lg-3" key={s.label}>
            <div className="theme-card p-3 h-100">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-secondary" style={{ fontSize: 12 }}>{s.label}</span>
                <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 32, height: 32, background: s.bg }}>
                  <i className={`fa-solid ${s.icon}`} style={{ color: s.color, fontSize: 13 }} />
                </div>
              </div>
              <div className="fw-semibold" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
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
            <ResponsiveContainer width="100%" height={220}>
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
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="mb-3">
              <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Daily spending</p>
              <small className="text-secondary">Last 7 days</small>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--app-border-soft)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#7b8794", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#7b8794", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `\u20b9${v / 1000}k` : `\u20b9${v}`)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="spent" name="Spent" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
            {pieData.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center text-secondary" style={{ height: 220, fontSize: 13 }}>No expense data yet</div>
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
            {recent.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center text-secondary" style={{ height: 180, fontSize: 13 }}>No transactions yet</div>
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
                        <div className="text-secondary" style={{ fontSize: 11 }}>{t.date}</div>
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
