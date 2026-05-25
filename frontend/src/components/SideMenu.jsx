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
      if (event.key === "Escape" && !collapsed && isMobile()) {
        setCollapsed(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collapsed]);

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

      <div className={`sidebar d-flex flex-column ${collapsed ? "collapsed" : ""}`}>
        {/* Profile */}
        <div className="pt-4 text-center pb-4">
          {!collapsed ? (
            <>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="profile"
                  className="profile-img mb-2"
                />
              ) : (
                <div
                  className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
                  style={{ width: 70, height: 70, fontSize: 24 }}
                >
                  {initials}
                </div>
              )}
              <h6 className="mb-0">{user?.name || "User"}</h6>
              <small className="text-secondary">Expense Tracker</small>
            </>
          ) : null}
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

          <NavLink to="/support" className="menu-link" onClick={closeMobileMenu}>
            <i className="fa-solid fa-phone"></i>
            {!collapsed && <span>Support</span>}
          </NavLink>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="menu-link btn border-0 text-start mt-2 logout-link"
          >
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
    </>
  );
};

export default SideMenu;
