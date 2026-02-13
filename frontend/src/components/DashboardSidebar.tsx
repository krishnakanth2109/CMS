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

  const isAdmin = user?.role === "admin";
  const hubTitle = isAdmin ? "AdminHub" : "RecruiterHub";

  // ------------------------------
  // Apple White-Blue Theme Items
  // ------------------------------
  const adminItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Recruiters", path: "/admin/recruiters" },
    { icon: Database, label: "Candidate Database", path: "/admin/candidates" },
    { icon: ClipboardList, label: "Requirements", path: "/admin/requirements" },
    { icon: Building, label: "Client Info", path: "/admin/clients" },
    { icon: Receipt, label: "Client Invoice", path: "/admin/invoices" },
    { icon: Calendar, label: "Recruiter Schedules", path: "/admin/schedules" },
    { icon: MessageSquare, label: "Messages", path: "/admin/messages" },
    { icon: BarChart3, label: "Reports", path: "/admin/reports" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  const recruiterItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/recruiter" },
    { icon: Database, label: "My Candidates", path: "/recruiter/candidates" },
    { icon: Briefcase, label: "My Jobs", path: "/recruiter/assignments" },
    { icon: Calendar, label: "My Interviews", path: "/recruiter/schedules" },
    { icon: MessageSquare, label: "Messages", path: "/recruiter/messages" },
    { icon: FileText, label: "Reports", path: "/recruiter/reports" },
    { icon: UserCircle, label: "Profile", path: "/recruiter/profile" },
    { icon: Settings, label: "Settings", path: "/recruiter/settings" },
  ];

  const items = isAdmin ? adminItems : recruiterItems;

  return (
    <motion.div
      animate={{ width: collapsed ? "5rem" : "16rem" }}
      className="
        h-screen 
        bg-white 
        dark:bg-[#1c1c1e]
        border-r border-gray-200 dark:border-gray-700 
        text-gray-900 dark:text-gray-100 
        flex flex-col sticky top-0 
        transition-all duration-300 overflow-hidden
        shadow-sm
      "
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm">
              <img
                src="https://image2url.com/images/1765523015480-3c8632f4-a4fc-4c81-bb52-a5d3845a956f.png"
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>

            {/* Title */}
            <div>
              <h2 className="text-lg font-semibold text-[#007aff]">
                {hubTitle}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAdmin ? "Admin Panel" : "Recruiter Portal"}
              </p>
            </div>
          </div>
        )}

        {/* Collapse Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <AnimatePresence mode="wait" initial={false}>
            {collapsed ? (
              <motion.div
                key="open"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <Menu className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="close"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
              >
                <X className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
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
                variant="ghost"
                className={`
                  w-full justify-start gap-3 rounded-lg transition-all
                  ${isActive
                    ? "bg-[#e6f0ff] text-[#007aff] font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300"
                  }
                `}
                onClick={() => navigate(item.path)}
              >
                <Icon
                  className={`
                    h-5 w-5
                    ${isActive ? "text-[#007aff]" : "text-gray-500 group-hover:text-[#007aff]"}
                  `}
                />
                {!collapsed && <span>{item.label}</span>}
              </Button>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-16 top-1/2 -translate-y-1/2 hidden group-hover:block bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-50 text-xs rounded px-2 py-1 shadow-md border border-gray-200 dark:border-gray-700 z-40">
                  {item.label}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
          onClick={toggleDarkMode}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>}
        </Button>

        {/* User Info */}
        {!collapsed && (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              @{user?.username}
            </p>
          </div>
        )}

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </motion.div>
  );
}
