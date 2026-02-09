import { useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Key, BarChart3, Upload, LogOut } from "lucide-react";

export function Dashboard() {
  const { user, token, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResendVerification() {
    setResending(true);
    try {
      await api("/auth/resend-verification", { method: "POST", token });
      setResent(true);
    } catch {
      // silently fail
    } finally {
      setResending(false);
    }
  }

  const navItems = [
    { to: "/dashboard", icon: BarChart3, label: "Usage", end: true },
    { to: "/dashboard/keys", icon: Key, label: "API Keys", end: false },
    { to: "/dashboard/playground", icon: Upload, label: "Playground", end: false },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-white">
        <div className="border-b px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">ImageForge</h1>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-2">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {user && !user.emailVerified && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              Your email is not verified.{" "}
              <Link to="/check-email" className="font-medium underline">
                Verify now
              </Link>
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resending || resent}
              className="text-xs text-amber-700 hover:underline disabled:opacity-50"
            >
              {resent ? "Sent!" : resending ? "Sending..." : "Resend email"}
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
