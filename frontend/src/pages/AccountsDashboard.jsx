
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Files,
  Clock3,
  CheckCircle2,
  XCircle,
  IndianRupee,
  RefreshCw,
} from "lucide-react";
import { getVouchers } from "../services/voucherService";
import { logoutUser } from "../services/authService";

const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

export default function AccountsDashboard() {
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
      setError(err.response?.data?.message || "Unable to load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  const approved = vouchers.filter((v) => v.status === "APPROVED");
  const pending = vouchers.filter((v) => v.status === "PENDING_APPROVAL");
  const rejected = vouchers.filter((v) => v.status === "REJECTED");

  const approvedAmount = approved.reduce(
    (sum, voucher) => sum + Number(voucher.amount || 0), 0
  );

  const stats = [
    { label: "Total Vouchers", value: vouchers.length, icon: Files },
    { label: "Pending Approval", value: pending.length, icon: Clock3 },
    { label: "Approved", value: approved.length, icon: CheckCircle2 },
    { label: "Rejected", value: rejected.length, icon: XCircle },
    { label: "Total Approved Amount", value: money(approvedAmount), icon: IndianRupee },
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
          <h1>Accounts Dashboard</h1>
          <p className="muted">
            Review company expense vouchers and approval records.
          </p>
        </div>
        <button className="secondary-button" onClick={logout}>Sign out</button>
      </header>

      <nav className="action-bar">
        <Link className="primary-link" to="/accounts/vouchers">
          <Files size={18} /> View All Vouchers
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
            <h2>Recently Approved Vouchers</h2>
            <p className="muted">
              Latest approved expense records for Accounts review.
            </p>
          </div>
          <Link className="text-link" to="/accounts/vouchers">View all</Link>
        </div>

        {loading ? <p>Loading vouchers...</p> : approved.length === 0 ? (
          <div className="empty-state">
            <Files size={30} />
            <h3>No approved vouchers yet</h3>
            <p>Approved claims will appear here.</p>
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
                  <th>Approval Date</th>
                </tr>
              </thead>
              <tbody>
                {[...approved]
                  .sort((a, b) => new Date(b.approvalDate || b.updatedAt) -
                    new Date(a.approvalDate || a.updatedAt))
                  .slice(0, 5)
                  .map((v) => (
                    <tr key={v._id}>
                      <td>{v.voucherNumber}</td>
                      <td>{v.employee?.name || "—"}</td>
                      <td>{v.department}</td>
                      <td>{v.expenseTitle}</td>
                      <td>{money(v.amount)}</td>
                      <td>
                        {v.approvalDate
                          ? new Date(v.approvalDate).toLocaleDateString("en-IN")
                          : "—"}
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
