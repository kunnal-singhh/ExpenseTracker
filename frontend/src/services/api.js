// src/services/api.js
// Central API service — swap out the base URL when deploying

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = rawBaseUrl.replace(/\/$/, "");

// ─── Helper ───────────────────────────────────────────
let memoryToken = null;
export const setToken = (t) => { memoryToken = t; };

function getToken() {
  return memoryToken;
}

async function request(endpoint, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
      credentials: "include",
    });
  } catch {
    throw new Error("Cannot reach backend. Check API URL and CORS settings.");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (res.status === 401 && !options._retry && !["/auth/refresh", "/auth/login", "/auth/register"].includes(endpoint)) {
    options._retry = true;
    try {
      const refreshData = await authAPI.refreshToken();
      if (refreshData && refreshData.token) {
         setToken(refreshData.token);
         return request(endpoint, options);
      }
    } catch(err) {
      setToken(null);
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!res.ok) {
    console.error(data || `${res.status} ${res.statusText}`);
    const err = new Error(data?.message || "Request failed");
    err.data = data;
    throw err;
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:    (body) => request("/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  verify:   (body) => request("/auth/verify",   { method: "POST", body: JSON.stringify(body) }),
  getMe:    ()     => request("/auth/me"),
  refreshToken: () => request("/auth/refresh", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
  logoutAll: () => request("/auth/logoutAll", { method: "POST" }),
};

// ─── Transactions ─────────────────────────────────────
export const transactionAPI = {
  getAll:  (params = "") => request(`/transactions${params}`),
  create:  (body)        => request("/transactions", { method: "POST", body: JSON.stringify(body) }),
  categorize: (body)     => request("/transactions/categorize", { method: "POST", body: JSON.stringify(body) }),
  delete:  (id)          => request(`/transactions/${id}`, { method: "DELETE" }),
  summary: ()            => request("/transactions/summary"),
};

// ─── User ─────────────────────────────────────────────
export const userAPI = {
  updateProfile:  (body) => request("/user/profile",  { method: "PUT", body: JSON.stringify(body) }),
  changeEmail:    (body) => request("/user/email",    { method: "PUT", body: JSON.stringify(body) }),
  changePassword: (body) => request("/user/password", { method: "PUT", body: JSON.stringify(body) }),
};

// ─── Support ──────────────────────────────────────────
export const supportAPI = {
  create: (body) => request("/support", { method: "POST", body: JSON.stringify(body) }),
  getAll: () => request("/support"),
};

// ─── Admin ───────────────────────────────────────────
export const aiAPI = {
  chat: (body) => request("/ai/chat", { method: "POST", body: JSON.stringify(body) }),
};

export const adminAPI = {
  getStats: () => request("/admin/stats"),
  getUsers: () => request('/admin/users'),
  getSupportRequests: () => request('/admin/support'),
  updateSupportStatus: (id, body) => request(`/admin/support/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  updateUserAdmin: (id, body) => request(`/admin/users/${id}/admin`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
};
