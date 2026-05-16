import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getInitials } from "../utils/helpers";
import toast from "react-hot-toast";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Signed out");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>Sync Scribe</h1>
          <span>Your thinking space</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/notes"
            className={({ isActive }) => `nav-item${isActive ? "active" : ""}`}
          >
            <FileText size={16} />
            Notes
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>

          <div className="nav-label" style={{ marginTop: 24 }}>
            AI Features
          </div>
          <div className="nav-item" style={{ cursor: "default", opacity: 0.5 }}>
            <Sparkles size={16} />
            {user?.aiUsageCount || 0} summaries used
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.name)}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
            <button
              className="btn-icon btn-ghost"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
