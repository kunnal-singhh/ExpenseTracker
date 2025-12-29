import SideMenu from "./SideMenu";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="d-flex vh-100 overflow-hidden">

      {/* Sidebar */}
      <SideMenu />

      {/* Right Content Wrapper (SCROLL CONTAINER) */}
      <div
        className="flex-grow-1 bg-dark overflow-auto"
        style={{
          borderLeft: "3px solid black",
        }}
      >
        {/* Inner Content (Controls Width & Height) */}
        <div
          style={{
            minWidth: "1000px",   // prevents overlap
            minHeight: "100%",    // ensures vertical growth
            padding: "1rem",
          }}
        >
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default Layout;
