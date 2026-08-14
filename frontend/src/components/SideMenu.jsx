// src/components/SideMenu.jsx — updated version
// Shows real user name from context + adds a Logout button

import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ETlogo from "../assets/ETlogo.png";
import useExpense from "../context/expenseContext";

const SideMenu = () => {
  const { user, logout } = useExpense();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [isManual, setIsManual] = useState(true);
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);

  const isMobile = () => window.innerWidth < 768;

  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) {
        setCollapsed(true);
      } else if (!isManual) {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isManual]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && showProfilePhoto) {
        setShowProfilePhoto(false);
        return;
      }

      if (event.key === "Escape" && !collapsed && isMobile()) {
        setCollapsed(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed, showProfilePhoto]);

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (!isMobile()) setIsManual(newState);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    if (isMobile()) setCollapsed(true);
  };

  // Avatar initials
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const renderProfilePhoto = (compact = false) => (
    <button
      type="button"
      className={`profile-photo-btn ${compact ? "compact" : ""}`}
      onClick={() => setShowProfilePhoto(true)}
      aria-label="View profile photo"
    >
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt="profile"
          className={compact ? "collapsed-profile-img" : "profile-img mb-2"}
        />
      ) : (
        <div className={compact ? "collapsed-profile-img bg-primary text-white fw-bold" : "profile-img profile-initials mb-2 bg-primary text-white fw-bold"}>
          {initials}
        </div>
      )}
    </button>
  );

  return (
    <>
      {!collapsed && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Floating hamburger for mobile when collapsed */}
      {collapsed && (
        <button
          type="button"
          className="btn theme-chip shadow-sm d-md-none mobile-nav-toggle"
          onClick={() => setCollapsed(false)}
          aria-label="Open navigation"
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      )}

      <div className={`sidebar d-flex flex-column ${collapsed ? "collapsed" : ""}`}>
        {/* Profile */}
        <div className="profile-area pt-4 text-center pb-4">
          {!collapsed ? (
            <>
              {renderProfilePhoto()}
              <h6 className="mb-0">{user?.name || "User"}</h6>
              <small className="text-secondary">Expense Tracker</small>
            </>
          ) : (
            <div className="collapsed-profile">
              {renderProfilePhoto(true)}
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          type="button"
          className="toggle-btn"
          onClick={handleToggle}
          aria-label={collapsed ? "Open navigation" : "Close navigation"}
          aria-expanded={!collapsed}
        >
          <i className={`fa-solid ${collapsed ? "fa-bars" : "fa-xmark"}`}></i>
        </button>

        {/* Menu Links */}
        <div className="menu d-flex flex-column">
          <NavLink to="/" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-house"></i>
            {!collapsed && <span>Dashboard</span>}
          </NavLink>

          <NavLink to="/balance" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-piggy-bank"></i>
            {!collapsed && <span>Add Balance</span>}
          </NavLink>

          <NavLink to="/expense" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-money-check-dollar"></i>
            {!collapsed && <span>Add Expense</span>}
          </NavLink>

          <NavLink to="/transactions" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-money-bill-transfer"></i>
            {!collapsed && <span>Transactions</span>}
          </NavLink>

          <NavLink to="/settings" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-gear"></i>
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {user?.isAdmin && (
            <NavLink to="/admin" className="menu-link" onClick={closeMobileMenu}>
              <i className="fa-solid fa-shield-halved"></i>
              {!collapsed && <span>Admin</span>}
            </NavLink>
          )}

          <NavLink to="/support" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-phone"></i>
            {!collapsed && <span>Support</span>}
          </NavLink>

          <button type="button" className="menu-link text-danger border-0 bg-transparent text-start w-100" onClick={() => { closeMobileMenu(); handleLogout(); }}>
            <i className="fa-solid fa-right-from-bracket"></i>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Logo */}
        <div className="logo-area text-center py-3">
          <img
            src={ETlogo}
            alt="ET Logo"
            className={`logo ${collapsed ? "rotate" : ""}`}
          />
        </div>
      </div>

      {showProfilePhoto && (
        <div className="profile-photo-backdrop" role="presentation" onClick={() => setShowProfilePhoto(false)}>
          <div className="profile-photo-card theme-card" role="dialog" aria-modal="true" aria-labelledby="profile-photo-title" onClick={(event) => event.stopPropagation()}>
            <div className="d-flex align-items-center justify-content-between gap-3 px-3 px-md-4 py-3 border-bottom" style={{ borderColor: "var(--app-border-soft)" }}>
              <div style={{ minWidth: 0 }}>
                <h5 id="profile-photo-title" className="fw-semibold mb-0 text-truncate">{user?.name || "User"}</h5>
                <small className="text-secondary">Profile photo</small>
              </div>
              <button type="button" className="btn btn-link border-0 p-1 text-secondary" aria-label="Close profile photo" onClick={() => setShowProfilePhoto(false)}>
                <i className="fa-solid fa-xmark" style={{ fontSize: 18 }} />
              </button>
            </div>

            <div className="profile-photo-preview p-3 p-md-4">
              {user?.avatar ? (
                <img src={user.avatar} alt="profile enlarged" />
              ) : (
                <div className="profile-photo-placeholder bg-primary text-white fw-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideMenu;
