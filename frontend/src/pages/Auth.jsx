import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useExpense from "../context/expenseContext";
import { ButtonSpinner } from "../components/UiStates";
import { useToast } from "../components/useToast";

const isGoogleEmail = (email = "") => /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email.trim());

export default function Auth() {
  const { login, register, authLoading } = useExpense();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isGoogleEmail(form.email)) {
      return setError("Please use a valid Google email address");
    }

    try {
      if (mode === "login") {
        await login(form.email, form.password);
        showToast("Welcome back.", "success");
        navigate("/");
      } else {
        if (!form.name.trim()) return setError("Name is required");
        await register(form.name.trim(), form.email, form.password);
        showToast("Account created successfully.", "success");
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-shell d-flex align-items-center justify-content-center p-3">
      <div className="auth-card theme-card p-4 p-md-5">
        <div className="text-center mb-4">
          <div className="auth-mark mx-auto mb-3 d-flex align-items-center justify-content-center">
            <i className="fa-solid fa-wallet" />
          </div>
          <h4 className="fw-semibold mb-1">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h4>
          <small className="text-secondary">
            {mode === "login" ? "Log in to your Expense Tracker" : "Start tracking with your Google email"}
          </small>
        </div>

        {error && (
          <div className="rounded-3 py-2 px-3 mb-3 text-center" style={{ background: "rgba(239,68,68,.12)", color: "var(--app-danger)", fontSize: 13 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} className="d-flex flex-column gap-3">
          <>
            {mode === "register" && (
              <div>
                <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>NAME</label>
                <input name="name" type="text" className="form-control theme-input py-3" placeholder="Your name" value={form.name} onChange={change} required />
              </div>
            )}

            <div>
              <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>GOOGLE EMAIL</label>
              <input name="email" type="email" className="form-control theme-input py-3" placeholder="you@gmail.com" value={form.email} onChange={change} required />
              <small className="text-secondary d-block mt-2" style={{ fontSize: 12 }}>Only Gmail or Googlemail addresses are accepted.</small>
            </div>

            <div>
              <label className="text-secondary mb-2" style={{ fontSize: 11, fontWeight: 700 }}>PASSWORD</label>
              <input name="password" type="password" className="form-control theme-input py-3" placeholder="Min 6 characters" value={form.password} onChange={change} required />
            </div>
          </>

          <button type="submit" className="btn fw-semibold py-3 w-100 mt-1" disabled={authLoading} style={{ background: "var(--app-primary)", color: "#fff", border: 0, borderRadius: 8 }}>
            {authLoading ? <ButtonSpinner label="Please wait..." /> : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-secondary mt-3 mb-0" style={{ fontSize: 14 }}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="btn btn-link p-0"
            style={{ fontSize: 14, color: "var(--app-primary)" }}
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
