
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, RefreshCw } from "lucide-react";
import { deleteVoucher, getVouchers } from "../services/voucherService";

const statusLabel = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function MyVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVouchers() {
    setLoading(true);
    setError("");

    try {
      const data = await getVouchers({
        ...(status ? { status } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setVouchers(data.vouchers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load vouchers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, [status]);

  async function handleDelete(voucher) {
    const confirmed = window.confirm(
      `Delete draft ${voucher.voucherNumber}? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteVoucher(voucher._id);
      await loadVouchers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete draft.");
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadVouchers();
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">EMPLOYEE WORKSPACE</p>
          <h1>My Vouchers</h1>
          <p className="muted">View your expense claims and approval status.</p>
        </div>
        <Link className="secondary-link" to="/employee">
          <ArrowLeft size={17} /> Dashboard
        </Link>
      </header>

      <div className="welcome-card">
        <form className="filter-bar" onSubmit={handleSearch}>
          <input
            aria-label="Search vouchers"
            placeholder="Search voucher number, title or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button className="primary-button filter-button" type="submit">
            Search
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("");
              getVouchers()
                .then((data) => setVouchers(data.vouchers || []))
                .catch(() => setError("Unable to refresh vouchers."));
            }}
          >
            <RefreshCw size={15} /> Reset
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p>Loading vouchers...</p>
        ) : vouchers.length === 0 ? (
          <div className="empty-state">
            <h3>No matching vouchers</h3>
            <p>Create a voucher or change your search filters.</p>
            <Link className="primary-link" to="/employee/vouchers/new">
              Create Voucher
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Expense</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Rejection Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td>{voucher.voucherNumber}</td>
                    <td>{voucher.expenseTitle}</td>
                    <td>{voucher.department}</td>
                    <td>
                      {voucher.expenseDate
                        ? new Date(voucher.expenseDate).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>
                      {Number(voucher.amount || 0).toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      })}
                    </td>
                    <td>
                      <span className={`status-badge status-${voucher.status.toLowerCase()}`}>
                        {statusLabel[voucher.status] || voucher.status}
                      </span>
                    </td>
                    <td>{voucher.rejectionReason || "—"}</td>
                    <td>
                      {voucher.status === "DRAFT" ? (
                        <div className="table-actions">
                          <Link
                            className="icon-link"
                            title="Edit draft"
                            to={`/employee/vouchers/${voucher._id}/edit`}
                          >
                            <Pencil size={17} />
                          </Link>
                          <button
                            className="icon-button danger"
                            title="Delete draft"
                            onClick={() => handleDelete(voucher)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ) : (
                        <span className="muted">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
