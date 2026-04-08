// src/services/api.js
// Central API service — swap out the base URL when deploying

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── Helper ───────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}

async function request(endpoint, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  const data = await res.json();
  // if (!res.ok) throw new Error(data.message || "Request failed");
  if (!res.ok) {
  console.error(data); // debug
  throw new Error(data.message || "Request failed");
}
  return data;
}

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:    (body) => request("/auth/login",    { method: "POST", body: JSON.stringify(body) }),
  getMe:    ()     => request("/auth/me"),
};

// ─── Transactions ─────────────────────────────────────
export const transactionAPI = {
  getAll:  (params = "") => request(`/transactions${params}`),
  create:  (body)        => request("/transactions", { method: "POST", body: JSON.stringify(body) }),
  delete:  (id)          => request(`/transactions/${id}`, { method: "DELETE" }),
  summary: ()            => request("/transactions/summary"),
};

// ─── User ─────────────────────────────────────────────
export const userAPI = {
  updateProfile:  (body) => request("/user/profile",  { method: "PUT", body: JSON.stringify(body) }),
  changePassword: (body) => request("/user/password", { method: "PUT", body: JSON.stringify(body) }),
};
