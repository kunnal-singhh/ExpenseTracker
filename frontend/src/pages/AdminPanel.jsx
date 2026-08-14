import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useExpense from "../context/expenseContext";
import { adminAPI } from "../services/api";
import { SkeletonLine } from "../components/UiStates";
import { useToast } from "../components/useToast";

const SUPPORT_STATUSES = ["open", "in_progress", "resolved"];

const statusLabel = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const money = (value = 0) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const StatCard = ({ icon, label, value, tone = "primary" }) => {
  const colors = {
    primary: "var(--app-primary)",
    success: "var(--app-success)",
    warning: "var(--app-warning)",
    danger: "var(--app-danger)",
  };

  return (
    <div className="theme-card p-3 h-100">
      <div className="d-flex align-items-center justify-content-between gap-3">
        <div style={{ minWidth: 0 }}>
          <div className="text-secondary" style={{ fontSize: 12 }}>{label}</div>
          <div className="fw-semibold mt-1 text-truncate" style={{ fontSize: 20 }}>{value}</div>
        </div>
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: 38, height: 38, background: "rgba(59,130,246,.12)" }}>
          <i className={`fa-solid ${icon}`} style={{ color: colors[tone], fontSize: 14 }} />
        </div>
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const { user: currentUser } = useExpense();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const loadAdminData = async () => {
    const [statsData, userData, supportData] = await Promise.all([
      adminAPI.getStats(),
      adminAPI.getUsers(),
      adminAPI.getSupportRequests(),
    ]);
    setStats(statsData.stats || null);
    setUsers(userData.users || []);
    setRequests(supportData.requests || []);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        await loadAdminData();
      } catch (err) {
        console.error(err);
        if (!mounted) return;

        if (err.message === "Admin access required") {
          navigate("/");
          return;
        }

        showToast(err.message || "Could not load admin data.", "danger");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [navigate, showToast]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) return users;
    return users.filter((item) =>
      `${item.name || ""} ${item.email || ""}`.toLowerCase().includes(query)
    );
  }, [userSearch, users]);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((item) => item.status === statusFilter);
  }, [requests, statusFilter]);

  const refreshAfterAction = async (successMessage) => {
    await loadAdminData();
    showToast(successMessage, "success");
  };

  const changeSupportStatus = async (requestId, status) => {
    setSavingId(`support-${requestId}`);
    try {
      await adminAPI.updateSupportStatus(requestId, { status });
      await refreshAfterAction("Support ticket updated.");
    } catch (err) {
      showToast(err.message || "Could not update support ticket.", "danger");
    } finally {
      setSavingId("");
    }
  };

  const toggleAdmin = async (targetUser) => {
    const nextAdmin = !targetUser.isAdmin;
    setSavingId(`user-${targetUser._id}`);
    try {
      await adminAPI.updateUserAdmin(targetUser._id, { isAdmin: nextAdmin });
      await refreshAfterAction(nextAdmin ? "Admin access granted." : "Admin access removed.");
    } catch (err) {
      showToast(err.message || "Could not update admin access.", "danger");
    } finally {
      setSavingId("");
    }
  };

  const removeUser = async (targetUser) => {
    const ok = window.confirm(`Delete ${targetUser.email}? This also deletes their transactions and support requests.`);
    if (!ok) return;

    setSavingId(`delete-${targetUser._id}`);
    try {
      await adminAPI.deleteUser(targetUser._id);
      await refreshAfterAction("User deleted.");
    } catch (err) {
      showToast(err.message || "Could not delete user.", "danger");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return (
      <div className="theme-page mt-4 mb-5 pb-4">
        <div className="theme-card p-4">
          <SkeletonLine width="22%" height={22} className="mb-3" />
          <SkeletonLine width="100%" height={14} className="mb-2" />
          <SkeletonLine width="78%" height={14} />
        </div>
      </div>
    );
  }

  return (
    <div className="theme-page mt-4 mb-5 pb-4">
      <div className="d-flex align-items-start justify-content-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="rounded-3 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34, background: "rgba(59,130,246,.14)" }}>
              <i className="fa-solid fa-user-shield" style={{ color: "var(--app-primary)", fontSize: 14 }} />
            </div>
            <h4 className="fw-semibold mb-0">Admin Panel</h4>
          </div>
          <small className="text-secondary">Manage users, support tickets, and app-wide activity.</small>
        </div>
        <button type="button" className="btn theme-chip fw-semibold px-3 py-2" style={{ borderRadius: 8, fontSize: 13 }} onClick={() => refreshAfterAction("Admin data refreshed.")}>
          <i className="fa-solid fa-rotate me-2" />
          Refresh
        </button>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-xl-3"><StatCard icon="fa-users" label="Users" value={stats?.totalUsers || 0} /></div>
        <div className="col-6 col-xl-3"><StatCard icon="fa-headset" label="Open Tickets" value={stats?.support?.open || 0} tone="warning" /></div>
        <div className="col-6 col-xl-3"><StatCard icon="fa-arrow-trend-up" label="Total Income" value={money(stats?.totalIncome)} tone="success" /></div>
        <div className="col-6 col-xl-3"><StatCard icon="fa-arrow-trend-down" label="Total Expense" value={money(stats?.totalExpense)} tone="danger" /></div>
      </div>

      <div className="row g-3">
        <section className="col-12 col-xl-5">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>User Management</p>
                <small className="text-secondary">{stats?.totalAdmins || 0} admin account{stats?.totalAdmins === 1 ? "" : "s"}</small>
              </div>
            </div>

            <input className="form-control theme-input py-2 mb-3" placeholder="Search users" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />

            {filteredUsers.length === 0 ? <div className="text-secondary" style={{ fontSize: 13 }}>No users found</div> : (
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {filteredUsers.map((item) => {
                  const isSelf = String(item._id) === String(currentUser?.id || currentUser?._id);
                  return (
                    <li key={item._id} className="theme-card-muted p-3">
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div style={{ minWidth: 0 }}>
                          <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{item.name || "Unnamed user"}</div>
                          <div className="text-secondary text-truncate" style={{ fontSize: 12 }}>{item.email}</div>
                        </div>
                        {item.isAdmin && <span className="badge" style={{ background: "rgba(59,130,246,.14)", color: "var(--app-primary)" }}>Admin</span>}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <button type="button" className="btn theme-chip fw-semibold px-3 py-2" disabled={isSelf || savingId === `user-${item._id}`} style={{ borderRadius: 8, fontSize: 12, minWidth: 120 }} onClick={() => toggleAdmin(item)}>
                          {savingId === `user-${item._id}` ? (
                            <><i className="fa-solid fa-spinner fa-spin me-2" />Wait...</>
                          ) : item.isAdmin ? (
                            "Remove Admin"
                          ) : (
                            "Make Admin"
                          )}
                        </button>
                        <button type="button" className="btn fw-semibold px-3 py-2" disabled={isSelf || savingId === `delete-${item._id}`} style={{ borderRadius: 8, fontSize: 12, color: "var(--app-danger)", background: "rgba(239,68,68,.10)", border: "1px solid rgba(239,68,68,.18)", minWidth: 80 }} onClick={() => removeUser(item)}>
                          {savingId === `delete-${item._id}` ? <i className="fa-solid fa-spinner fa-spin" /> : "Delete"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="col-12 col-xl-7">
          <div className="theme-card p-3 p-md-4 h-100">
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3 flex-wrap">
              <div>
                <p className="fw-semibold mb-0" style={{ fontSize: 14 }}>Support Workflow</p>
                <small className="text-secondary">{stats?.totalSupportRequests || 0} submitted quer{stats?.totalSupportRequests === 1 ? "y" : "ies"}</small>
              </div>
              <select className="form-select theme-select py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 180, fontSize: 13 }}>
                <option value="all">All tickets</option>
                {SUPPORT_STATUSES.map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}
              </select>
            </div>

            {filteredRequests.length === 0 ? <div className="text-secondary" style={{ fontSize: 13 }}>No support requests</div> : (
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {filteredRequests.map((item) => (
                  <li key={item._id} className="theme-card-muted p-3">
                    <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>{item.subject}</div>
                        <div className="text-secondary" style={{ fontSize: 12 }}>From {item.user?.name || item.name || "User"} - {item.user?.email || item.email}</div>
                      </div>
                      <span className="badge text-capitalize" style={{ background: "rgba(16,185,129,.12)", color: "var(--app-success)" }}>{statusLabel[item.status] || "Open"}</span>
                    </div>
                    <div className="text-secondary mb-3" style={{ fontSize: 12, lineHeight: 1.5 }}>{item.message}</div>
                    <div className="d-flex gap-2 flex-wrap">
                      {SUPPORT_STATUSES.map((status) => (
                        <button key={status} type="button" className={`btn theme-chip fw-semibold px-3 py-2 ${item.status === status ? "active" : ""}`} disabled={item.status === status || savingId === `support-${item._id}`} style={{ borderRadius: 8, fontSize: 12 }} onClick={() => changeSupportStatus(item._id, status)}>
                          {statusLabel[status]}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
