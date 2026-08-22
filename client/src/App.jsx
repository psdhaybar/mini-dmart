import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ roles, children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div className="app-loading">Loading Mini D-Mart…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) {
    const path = { CUSTOMER: "/customer", STAFF: "/staff", MANAGER: "/manager", ADMIN: "/admin" }[user?.role];
    return <Navigate to={path || "/login"} replace />;
  }
  return children;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/customer" element={<ProtectedRoute roles={["CUSTOMER"]}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute roles={["STAFF"]}><StaffDashboard /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute roles={["MANAGER"]}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
