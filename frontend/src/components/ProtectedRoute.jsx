
import { Navigate, Outlet } from "react-router-dom";
import { getCurrentUser } from "../services/authService";

export default function ProtectedRoute({ allowedRoles }) {
  const user = getCurrentUser();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
