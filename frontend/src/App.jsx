
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AccountsDashboard from "./pages/AccountsDashboard";
import AccountsVouchers from "./pages/AccountsVouchers";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import CreateVoucher from "./pages/CreateVoucher";
import MyVouchers from "./pages/MyVouchers";

import { getCurrentUser, logoutUser } from "./services/authService";
import DirectorDashboard from "./pages/DirectorDashboard";
import PendingApprovals from "./pages/PendingApprovals";
import DirectorVouchers from "./pages/DirectorVouchers";
function DashboardRedirect() {
  const user = getCurrentUser();

  if (!user || !localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "EMPLOYEE":
      return <Navigate to="/employee" replace />;

    case "DIRECTOR":
      return <Navigate to="/director" replace />;

    case "ACCOUNTS":
      return <Navigate to="/accounts" replace />;

    default:
      logoutUser();
      return <Navigate to="/login" replace />;
  }
}

function RoleHome({ role }) {
  const user = getCurrentUser();

  const roleNames = {
    EMPLOYEE: "Employee Dashboard",
    DIRECTOR: "Director Dashboard",
    ACCOUNTS: "Accounts Dashboard",
  };

  function handleLogout() {
    logoutUser();
    window.location.href = "/login";
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PRACHAY SECURITIES PRIVATE LIMITED</p>
          <h1>{roleNames[role]}</h1>
          <p className="muted">
            Expense Voucher Management System
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={handleLogout}
        >
          Sign out
        </button>
      </header>

      <section className="welcome-card">
        <p className="eyebrow">SIGNED IN AS</p>
        <h2>{user?.name || "User"}</h2>
        <p>{user?.email}</p>
        <span className="role-chip">{role}</span>
      </section>

      <section className="welcome-card">
        <h2>Dashboard</h2>
        <p>
          The dashboard for this role is being prepared.
          You can sign out using the button above.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public login page */}
        <Route path="/login" element={<Login />} />

        {/* Employee pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["EMPLOYEE"]} />
          }
        >
          <Route
            path="/employee"
            element={<EmployeeDashboard />}
          />

          <Route
            path="/employee/vouchers"
            element={<MyVouchers />}
          />

          <Route
            path="/employee/vouchers/new"
            element={<CreateVoucher />}
          />

          <Route
            path="/employee/vouchers/:id/edit"
            element={<CreateVoucher />}
          />
        </Route>

        {/* Director pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["DIRECTOR"]} />
          }
        >
          <Route
            path="/director"
            element={<RoleHome role="DIRECTOR" />}
          />
        </Route>

        {/* Accounts pages */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["ACCOUNTS"]} />
          }
        >
          <Route
            path="/accounts"
            element={<RoleHome role="ACCOUNTS" />}
          />
        </Route>

        {/* Default navigation */}
        <Route
          path="/dashboard"
          element={<DashboardRedirect />}
        />

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* Unknown URLs */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />


        <Route path="/director" element={<DirectorDashboard />} />
  <Route path="/director/pending" element={<PendingApprovals />} />
  <Route path="/director/vouchers" element={<DirectorVouchers />} />
      
     <Route path="/accounts" element={<AccountsDashboard />} />
  <Route path="/accounts/vouchers" element={<AccountsVouchers />} /> 
      
      </Routes>
    </BrowserRouter>
  );
}
