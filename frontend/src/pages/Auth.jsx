// src/pages/Auth.jsx
// Login & Register page — drop this into src/pages/Auth.jsx
// Then add a route in App.jsx and a guard in Layout.jsx (see comments below)

import { useState } from "react";
import useExpense from "../context/expenseContext";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const { login, register, authLoading } = useExpense();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) return setError("Name is required");
        await register(form.name, form.email, form.password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center bg-dark"
      style={{ minHeight: "100vh" }}
    >
      <div
        className="card bg-black text-light p-4 rounded-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        {/* Logo / Title */}
        <div className="text-center mb-4">
          <h4 className="fw-bold">
            {mode === "login" ? "Welcome Back 👋" : "Create Account 🚀"}
          </h4>
          <small className="text-secondary">
            {mode === "login"
              ? "Log in to your Expense Tracker"
              : "Start tracking your expenses"}
          </small>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-danger py-2 text-center">{error}</div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="d-flex flex-column gap-3">
          {mode === "register" && (
            <div>
              <label className="form-label">Name</label>
              <input
                name="name"
                type="text"
                className="form-control bg-dark text-light border-secondary"
                placeholder="Your name"
                value={form.name}
                onChange={change}
                required
              />
            </div>
          )}

          <div>
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className="form-control bg-dark text-light border-secondary"
              placeholder="you@example.com"
              value={form.email}
              onChange={change}
              required
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className="form-control bg-dark text-light border-secondary"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={change}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-1"
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : mode === "login"
              ? "Log In"
              : "Create Account"}
          </button>
        </form>

        {/* Toggle Mode */}
        <p className="text-center text-secondary mt-3 mb-0" style={{ fontSize: "14px" }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            className="btn btn-link text-primary p-0"
            style={{ fontSize: "14px" }}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "Register" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
