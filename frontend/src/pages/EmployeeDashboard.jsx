
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FilePlus2,
  Files,
  Clock3,
  CheckCircle2,
  XCircle,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import { getVouchers } from "../services/voucherService";
import { logoutUser } from "../services/authService";
import "../styles.css";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const statusLabel = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function EmployeeDashboard() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVouchers() {
    setLoading(true);
    setError("");

    try {
      const data = await getVouchers();
      setVouchers(data.vouchers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  const totalClaimed = vouchers.reduce(
    (sum, voucher) => sum + Number(voucher.amount || 0),
    0
  );

  const stats = [
    { label: "Total Vouchers", value: vouchers.length, icon: Files },
    {
      label: "Drafts",
      value: vouchers.filter((v) => v.status === "DRAFT").length,
      icon: FilePlus2,
    },
    {
      label: "Pending Approval",
      value: vouchers.filter((v) => v.status === "PENDING_APPROVAL").length,
      icon: Clock3,
    },
    {
      label: "Approved",
      value: vouchers.filter((v) => v.status === "APPROVED").length,
      icon: CheckCircle2,
    },
    {
      label: "Rejected",
      value: vouchers.filter((v) => v.status === "REJECTED").length,
      icon: XCircle,
    },
    {
      label: "Total Claimed",
      value: money(totalClaimed),
      icon: IndianRupee,
    },
  ];

  function logout() {
    logoutUser();
    window.location.href = "/login";
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PRACHAY SECURITIES PRIVATE LIMITED</p>
          <h1>Employee Dashboard</h1>
          <p className="muted">Manage and track your expense claims.</p>
        </div>

        <button className="secondary-button" onClick={logout}>
          Sign out
        </button>
      </header>

      <nav className="action-bar">
        <Link className="primary-link" to="/employee/vouchers/new">
          <FilePlus2 size={18} /> Create Voucher
        </Link>
        <Link className="secondary-link" to="/employee/vouchers">
          <Files size={18} /> My Vouchers
        </Link>
        <button className="secondary-button" onClick={loadVouchers}>
          <RefreshCw size={16} /> Refresh
        </button>
      </nav>

      {error && <div className="error-message">{error}</div>}

      <section className="stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <article className="stat-card" key={label}>
            <div className="stat-icon"><Icon size={20} /></div>
            <p>{label}</p>
            <h2>{loading ? "—" : value}</h2>
          </article>
        ))}
      </section>

      <section className="welcome-card">
        <div className="section-heading">
          <div>
            <h2>Recent Vouchers</h2>
            <p className="muted">Your latest expense claims and their status.</p>
          </div>
          <Link to="/employee/vouchers" className="text-link">
            View all
          </Link>
        </div>

        {loading ? (
          <p>Loading vouchers...</p>
        ) : vouchers.length === 0 ? (
          <div className="empty-state">
            <Files size={30} />
            <h3>No vouchers yet</h3>
            <p>Create a voucher to start tracking an expense claim.</p>
            <Link className="primary-link" to="/employee/vouchers/new">
              Create your first voucher
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Expense</th>
                  <th>Expense Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                {[...vouchers]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 5)
                  .map((voucher) => (
                    <tr key={voucher._id}>
                      <td>{voucher.voucherNumber}</td>
                      <td>{voucher.expenseTitle}</td>
                      <td>
                        {voucher.expenseDate
                          ? new Date(voucher.expenseDate).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td>{money(voucher.amount)}</td>
                      <td>
                        <span className={`status-badge status-${voucher.status.toLowerCase()}`}>
                          {statusLabel[voucher.status] || voucher.status}
                        </span>
                      </td>
                      <td>{voucher.rejectionReason || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
