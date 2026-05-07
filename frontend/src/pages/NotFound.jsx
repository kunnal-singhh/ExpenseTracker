import React from "react";
import { NavLink } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="theme-page d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
      <div className="theme-card text-center p-4 p-md-5" style={{ maxWidth: 520, width: "100%" }}>
        <div className="auth-mark mx-auto mb-3 d-flex align-items-center justify-content-center">
          <i className="fa-solid fa-compass" />
        </div>
        <h1 className="display-1 fw-bold mb-0" style={{ color: "var(--app-danger)" }}>404</h1>
        <h4 className="mt-2 mb-2">Page not found</h4>
        <p className="text-secondary mb-4">The page you are looking for does not exist or has been moved.</p>
        <NavLink to="/" className="btn px-4 py-2 fw-semibold" style={{ background: "var(--app-primary)", color: "#fff", borderRadius: 8 }}>
          Go to Dashboard
        </NavLink>
      </div>
    </div>
  );
};

export default NotFound;
