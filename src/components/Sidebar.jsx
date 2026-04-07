import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  UserCircle2,
  Users,
} from "lucide-react";
import { clearSession, getRole } from "../services/session";

export default function Sidebar({ role, isMobileOpen = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const resolvedRole =
    role || getRole() || (location.pathname.startsWith("/admin") ? "admin" : "student");
  const isAdmin = resolvedRole === "admin";

  const adminItems = [
    { label: "Operations Overview", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Student Accounts", to: "/admin/manage-users", icon: Users },
    { label: "Course Catalog", to: "/admin/manage-courses", icon: BookOpen },
    { label: "Approval Queue", to: "/admin/registrations", icon: ClipboardList },
    { label: "Conflict Center", to: "/admin/conflict-resolver", icon: AlertTriangle },
  ];

  const studentItems = [
    { label: "Dashboard", to: "/user/dashboard", icon: LayoutDashboard },
    { label: "Browse Courses", to: "/user/browse-courses", icon: BookOpen },
    { label: "Weekly Schedule", to: "/user/schedule", icon: Calendar },
    { label: "My Requests", to: "/user/my-registrations", icon: UserCircle2 },
  ];

  const menuItems = isAdmin ? adminItems : studentItems;

  const handleLogout = () => {
    onClose?.();
    clearSession();
    navigate("/login");
  };

  return (
    <>
      <div className={`sidebar-overlay${isMobileOpen ? " visible" : ""}`} onClick={onClose} />

      <div className={`sidebar${isMobileOpen ? " mobile-open" : ""}`}>
        <h2 className="sidebar-title">CourseFlow</h2>

        <div className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
              onClick={onClose}
              tabIndex={0}
            >
              <item.icon size={16} className="sidebar-link-icon" />
              {item.label}
            </NavLink>
          ))}

          <button onClick={handleLogout} className="sidebar-logout">
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
