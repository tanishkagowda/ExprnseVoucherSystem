
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock3,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Files,
  RefreshCw,
  ClipboardCheck,
} from "lucide-react";
import { getVouchers } from "../services/voucherService";
import { logoutUser } from "../services/authService";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

export default function DirectorDashboard() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVouchers() {
    setLoading(true);
    setError("");

    try {
      const result = await getVouchers();
      setVouchers(result.vouchers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  const today = new Date().toDateString();
  const pending = vouchers.filter((v) => v.status === "PENDING_APPROVAL");
  const approvedToday = vouchers.filter(
    (v) => v.status === "APPROVED" &&
      v.approvalDate &&
      new Date(v.approvalDate).toDateString() === today
  );
  const rejectedToday = vouchers.filter(
    (v) => v.status === "REJECTED" &&
      v.updatedAt &&
      new Date(v.updatedAt).toDateString() === today
  );
  const pendingAmount = pending.reduce(
    (sum, voucher) => sum + Number(voucher.amount || 0), 0
  );

  const stats = [
    { label: "Pending Approvals", value: pending.length, icon: Clock3 },
    { label: "Approved Today", value: approvedToday.length, icon: CheckCircle2 },
    { label: "Rejected Today", value: rejectedToday.length, icon: XCircle },
    { label: "Pending Amount", value: money(pendingAmount), icon: IndianRupee },
    { label: "Total Vouchers", value: vouchers.length, icon: Files },
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
          <h1>Director Dashboard</h1>
          <p className="muted">Review and authorize employee expense claims.</p>
        </div>
        <button className="secondary-button" onClick={logout}>Sign out</button>
      </header>

      <nav className="action-bar">
        <Link className="primary-link" to="/director/pending">
          <ClipboardCheck size={18} /> Review Pending Vouchers
        </Link>
        <Link className="secondary-link" to="/director/vouchers">
          <Files size={18} /> All Vouchers
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
            <h2>Pending Approval Queue</h2>
            <p className="muted">The most recent vouchers awaiting your decision.</p>
          </div>
          <Link className="text-link" to="/director/pending">View queue</Link>
        </div>

        {loading ? <p>Loading...</p> : pending.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={30} />
            <h3>No pending approvals</h3>
            <p>There are no vouchers awaiting review.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Expense</th>
                  <th>Amount</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {pending.slice(0, 5).map((v) => (
                  <tr key={v._id}>
                    <td>{v.voucherNumber}</td>
                    <td>{v.employee?.name || "—"}</td>
                    <td>{v.department}</td>
                    <td>{v.expenseTitle}</td>
                    <td>{money(v.amount)}</td>
                    <td>
                      <Link className="text-link" to="/director/pending">
                        Review
                      </Link>
                    </td>
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
