// src/services/api.js
// Central API service — swap out the base URL when deploying

const rawBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = rawBaseUrl.replace(/\/$/, "");

// ─── Helper ───────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
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
    });
  } catch {
    throw new Error("Cannot reach backend. Check API URL and CORS settings.");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    console.error(data || `${res.status} ${res.statusText}`);
    throw new Error(data?.message || "Request failed");
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
