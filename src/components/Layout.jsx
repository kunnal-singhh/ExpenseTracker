import SideMenu from "./SideMenu";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div className="d-flex vh-100 ">

      {/* Sidebar */}
      <SideMenu />

      {/* Right Content Wrapper (SCROLL CONTAINER) */}
     <div className=" overflow-y-auto bg-dark " style={{width:'100%'}}> 
    <Outlet />
     </div>

    </div>
  );
};

export default Layout;
