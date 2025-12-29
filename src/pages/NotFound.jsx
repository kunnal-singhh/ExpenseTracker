import React from "react";
import { NavLink } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="container-fluid d-flex justify-content-center align-items-center bg-dark"
         style={{ minHeight: "100%", backgroundColor: "#121212" }}>

      <div
        className="text-center p-5 rounded-4"
        style={{
          backgroundColor: "#1e1e1e",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 0 15px rgba(0,0,0,0.6)"
        }}
      >
        <h1 className="display-1 fw-bold text-danger">404</h1>

        <h4 className="text-light mt-3">
          Page Not Found
        </h4>

        <p className="text-secondary mt-2">
          The page you are looking for doesn’t exist or has been moved.
        </p>

        <NavLink
          to="/"
          className="btn btn-primary mt-4 px-4"
        >
          Go to Dashboard
        </NavLink>
      </div>
    </div>
  );
};

export default NotFound;
