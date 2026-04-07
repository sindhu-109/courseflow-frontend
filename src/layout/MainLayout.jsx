import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function MainLayout({ children, role = "student" }) {
  return (
    <div className="app-layout">
      <Sidebar role={role} />
      <div className="app-main">
        <Navbar role={role} />
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
}
