import SideMenu from "./SideMenu";
import ContentArea from "./ContentArea";

const Layout = () => {
  return (
    <div className="d-flex vh-100">
      <SideMenu />
      <ContentArea />
    </div>
  );
};

export default Layout;
