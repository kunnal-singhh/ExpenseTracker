import React, { useState } from "react";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState("INR");

  const handleSave = () => {
    alert("Settings saved successfully!");
  };

  return (
    <div className=" text-light mt-4 ">
      <h2 className="mb-4">⚙️ Settings</h2>

      <div className="card bg-black text-light p-4 rounded-4">

        {/* Theme Setting */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span>Dark Mode</span>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
            />
          </div>
        </div>

        <hr />

        {/* Notification Setting */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span>Enable Notifications</span>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
          </div>
        </div>

        <hr />

        {/* Currency Setting */}
        <div className="mb-3">
          <label className="form-label">Default Currency</label>
          <select
            className="form-select bg-dark text-light border-secondary"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        <hr />

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-3">
          <button className="btn btn-secondary">Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
