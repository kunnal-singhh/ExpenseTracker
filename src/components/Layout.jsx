import SideMenu from "./SideMenu";
import {Outlet} from 'react-router-dom'
const Layout = () => {
  return (
    <div className="d-flex vh-100 overflow-hidden">
      
      <SideMenu />

     <div 
        className="w-100 p-3 bg-dark overflow-y-auto" 
        style={{ 
           backgroundColor: 'black', 
           borderLeft: '3px solid black',
           // We do NOT need minHeight: '100%' here because flexbox handles it
           // flex-grow-1 ensures it fills the space
           flexGrow: 1
        }}
      >
        {/* Outlet represents Dashboard, Transactions, etc. depending on URL */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
