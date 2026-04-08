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
        className="container-fluid overflow-y-auto bg-dark p-0 content-wrapper" 
        style={{ flex: 1, marginLeft: '3.4rem',paddingRight:'.7rem' }}
      > 
        {/* Centering Wrapper: col-11 for mobile, col-lg-9 for 75% width */}
        <div className="col-11 col-lg-6 mx-auto">
           <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
