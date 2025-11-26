import {
  LayoutDashboard,
  Users,
  Database,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  FileText,
  Moon,
  Sun,
  MessageSquare,
  Bell,
  Calendar,
  Menu,
  X,
  ClipboardList,
  Briefcase,
  Building,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Load dark mode preference
  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleSidebar = () => setCollapsed(!collapsed);

  // ✅ Sidebar Items
  const adminItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Recruiters", path: "/admin/recruiters" },
    { icon: Database, label: "Candidate Database", path: "/admin/candidates" },
    { icon: ClipboardList, label: "Requirements", path: "/admin/requirements" },
    { icon: Building, label: "Client Info", path: "/admin/clients" },
    { icon: Receipt, label: "Client Invoice", path: "/admin/invoices" },
    { icon: Calendar, label: "Recruiter Schedules", path: "/admin/schedules" },
    { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
    { icon: BarChart3, label: "Reports & Analytics", path: "/admin/reports" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const recruiterItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/recruiter" },
    { icon: Database, label: "My Candidates", path: "/recruiter/candidates" },
    { icon: Briefcase, label: "Assignments", path: "/recruiter/assignments" },
    { icon: Calendar, label: "Schedules", path: "/recruiter/schedules" },
    { icon: MessageSquare, label: "Messages", path: "/recruiter/messages" },
    { icon: Bell, label: "Notifications", path: "/recruiter/notifications" },
    { icon: FileText, label: "Reports", path: "/recruiter/reports" },
    { icon: UserCircle, label: "Profile", path: "/recruiter/profile" },
    { icon: Settings, label: "Settings", path: "/recruiter/settings" },
  ];

  const items = user?.role === "admin" ? adminItems : recruiterItems;

  return (
    <motion.div
      animate={{ width: collapsed ? "5rem" : "16rem" }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col sticky top-0 transition-all duration-300 overflow-hidden"
    >
      {/* === Header === */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">
                RecruiterHub
              </h2>
              <p className="text-xs text-sidebar-foreground/60">
                {user?.role === "admin" ? "Admin Panel" : "Recruiter Portal"}
              </p>
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-sidebar-accent/30 transition"
        >
          <AnimatePresence mode="wait" initial={false}>
            {collapsed ? (
              <motion.div
                key="open"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-5 w-5 text-sidebar-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="close"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-5 w-5 text-sidebar-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* === Menu Items === */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto relative">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group"
            >
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                onClick={() => navigate(item.path)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </Button>

              {/* Tooltip on hover when collapsed */}
              {collapsed && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* === Footer === */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
        </Button>

        {/* User Info */}
        {!collapsed && (
          <div className="p-3 rounded-lg bg-sidebar-accent/30">
            <p className="text-sm font-medium text-sidebar-foreground">
              {user?.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60">
              @{user?.username}
            </p>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </Button>
      </div>
    </motion.div>
  );
}