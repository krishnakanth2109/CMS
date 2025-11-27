import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// ✅ Context for Requirements & Assignments
import { JobsProvider } from "@/contexts/JobsContext";
import { ClientsProvider } from "@/contexts/ClientsContext";

// ✅ Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminRecruiters from "./pages/AdminRecruiters";
import AdminCandidates from "./pages/AdminCandidates";
import AddCandidate from "./pages/AddCandidate";
import AdminReports from "./pages/AdminReports";
import AdminSettings from "./pages/AdminSettings";
import RecruiterSchedules from "./pages/RecruiterSchedules";
import Requirements from "./pages/AdminRequirements";
import AdminClientInfo from "./pages/AdminClientInfo";
import AdminClientInvoice from "./pages/AdminClientInvoice";
import AdminMessages from "./pages/AdminMessages"; // Assuming AdminMessages.tsx is named Messages.tsx or update path

// ✅ Recruiter Pages
import RecruiterDashboard from "./pages/RecruiterDashboard";
import RecruiterCandidates from "./pages/RecruiterCandidates";
import RecruiterReports from "./pages/RecruiterReports";
import RecruiterProfile from "./pages/RecruiterProfile";
import RecruiterSettings from "./pages/RecruiterSettings";
import Schedules from "./pages/Schedules";
import Assignments from "./pages/RecruiterAssignments";
import RecruiterMessages from "./pages/MessagesRecruiters"; // New File

// ✅ Shared Pages
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ✅ Protected Route Wrapper
function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role)
    return (
      <Navigate
        to={user?.role === "admin" ? "/admin" : "/recruiter"}
        replace
      />
    );

  return <>{children}</>;
}

// ✅ All App Routes
function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Default Redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate
              to={user?.role === "admin" ? "/admin" : "/recruiter"}
              replace
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={user?.role === "admin" ? "/admin" : "/recruiter"}
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      {/* ====================== ADMIN ROUTES ====================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/recruiters"
        element={
          <ProtectedRoute role="admin">
            <AdminRecruiters />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/candidates"
        element={
          <ProtectedRoute role="admin">
            <AdminCandidates />
          </ProtectedRoute>
        }
      />
      {/* NEW ROUTE ADDED HERE */}
      <Route
        path="/admin/candidates/new"
        element={
          <ProtectedRoute role="admin">
            <AddCandidate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/requirements"
        element={
          <ProtectedRoute role="admin">
            <Requirements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute role="admin">
            <AdminClientInfo />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/invoices"
        element={
          <ProtectedRoute role="admin">
            <AdminClientInvoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules"
        element={
          <ProtectedRoute role="admin">
            <RecruiterSchedules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/messages"
        element={
          <ProtectedRoute role="admin">
            <AdminMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute role="admin">
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute role="admin">
            <AdminSettings />
          </ProtectedRoute>
        }
      />

      {/* ====================== RECRUITER ROUTES ====================== */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/candidates"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterCandidates />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/assignments"
        element={
          <ProtectedRoute role="recruiter">
            <Assignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/schedules"
        element={
          <ProtectedRoute role="recruiter">
            <Schedules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/messages"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/notifications"
        element={
          <ProtectedRoute role="recruiter">
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/reports"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/profile"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/recruiter/settings"
        element={
          <ProtectedRoute role="recruiter">
            <RecruiterSettings />
          </ProtectedRoute>
        }
      />

      {/* ====================== CATCH-ALL ====================== */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ✅ Main App Wrapper
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <JobsProvider>
              <ClientsProvider>
                <AppRoutes />
              </ClientsProvider>
            </JobsProvider>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;