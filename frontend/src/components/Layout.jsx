import SideMenu from "./SideMenu";
import { Outlet } from "react-router-dom";

// Layout.jsx
const Layout = () => {
  return (
    <div className="d-flex vh-100 overflow-hidden">
     <div className="sidebar-container">
        <SideMenu />
      </div>

      <div 
        className="container-fluid overflow-y-auto p-0 content-wrapper app-main" 
        style={{ flex: 1 }}
      > 
        {/* Centering Wrapper: col-11 for mobile, col-lg-9 for 75% width */}
        <div className="page-container mx-auto">
           <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
