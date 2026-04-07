import { useNavigate } from "react-router-dom";
import { Bell, GraduationCap, Shield } from "lucide-react";
import { clearSession, getCurrentUser } from "../services/session";

export default function Navbar({ role }) {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const notifications =
    role === "admin"
      ? ["New registrations waiting", "Conflict alerts active", "Catalog updates posted"]
      : ["Approval updates", "Upcoming class reminder", "New courses published"];

  return (
    <div className="topbar">
      <h3 className="topbar-title">
        {role === "admin" ? <Shield size={18} /> : <GraduationCap size={18} />}
        {role === "admin" ? "Admin operations" : "Student dashboard"}
      </h3>

      <div className="topbar-actions">
        <button
          className="notification-bell"
          title={notifications.join(" | ")}
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-profile">
          <span className="topbar-name">{currentUser?.name || "Campus user"}</span>
          <span className="topbar-role">
            {role === "admin" ? "Admin workspace" : "Student workspace"}
          </span>
        </div>

        <button onClick={handleLogout} className="btn-danger">
          Sign out
        </button>
      </div>
    </div>
  );
}
