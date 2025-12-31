import React, { useState,useEffect} from "react";
import { NavLink } from "react-router-dom";
import ETlogo from "../assets/ETlogo.png";

const SideMenu = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [isManual, setIsManual] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      // If the screen is small, always collapse it to save space
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } 
      // Only auto-expand if the screen is big AND the user hasn't manually collapsed it
      else if (!isManual) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isManual]); // Re-run effect logic if isManual status changes

  const handleToggle = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    
    // If the user clicks the button on a large screen, mark it as a manual choice
    if (window.innerWidth >= 768) {
      setIsManual(newState);
    }
  };
  return (
    <> 
    
    
     <div
      className={`sidebar bg-black text-light d-flex flex-column  ${
        collapsed ? "collapsed" : ""
      }`}
    >
      {/* Profile */}
      <div className="pt-4 text-center  pb-4">
        {!collapsed && (
          <>
            <img
              src="https://images.pexels.com/photos/14653174/pexels-photo-14653174.jpeg"
              alt="profile"
              className="profile-img mb-2"
            />
            <h6 className="mb-0">Kunal Singh</h6>
            <small className="text-secondary">Expense Tracker</small>
          </>
        )}
      </div>

      {/* Toggle Button */}
      <button
        className="toggle-btn text-light"
        onClick={handleToggle}
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      {/* Menu Links */}
      <div className="menu d-flex flex-column ">

        <NavLink to="/" className="menu-link">
          <i className="fa-solid fa-house"></i>
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/balance" className="menu-link">
          <i className="fa-solid fa-piggy-bank"></i>
          {!collapsed && <span>Add Balance</span>}
        </NavLink>

        <NavLink to="/expense" className="menu-link">
          <i className="fa-solid fa-money-check-dollar"></i>
          {!collapsed && <span>Add Expense</span>}
        </NavLink>

        <NavLink to="/transactions" className="menu-link">
          <i className="fa-solid fa-money-bill-transfer"></i>
          {!collapsed && <span>Transactions</span>}
        </NavLink>

        <NavLink to="/settings" className="menu-link">
          <i className="fa-solid fa-gear"></i>
          {!collapsed && <span>Settings</span>}
        </NavLink>

        <NavLink to="/support" className="menu-link">
          <i className="fa-solid fa-phone"></i>
          {!collapsed && <span>Support</span>}
        </NavLink>

      </div>

      {/* Logo */}
      <div className="logo-area  text-center py-3">
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
