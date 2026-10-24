
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { getVouchers } from "../services/voucherService";

export default function DirectorVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    department: "",
    category: "",
    from: "",
    to: "",
    minAmount: "",
    maxAmount: "",
    sort: "newest",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVouchers() {
    setLoading(true);
    setError("");

    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
      );
      const result = await getVouchers(params);
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

  function changeFilter(event) {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function resetFilters() {
    setFilters({
      search: "",
      status: "",
      department: "",
      category: "",
      from: "",
      to: "",
      minAmount: "",
      maxAmount: "",
      sort: "newest",
    });
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">DIRECTOR WORKSPACE</p>
          <h1>All Vouchers</h1>
          <p className="muted">Search and inspect company expense vouchers.</p>
        </div>
        <Link className="secondary-link" to="/director">
          <ArrowLeft size={17} /> Dashboard
        </Link>
      </header>

      <section className="welcome-card">
        <form
          className="advanced-filters"
          onSubmit={(event) => {
            event.preventDefault();
            loadVouchers();
          }}
        >
          <div className="form-field">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              name="search"
              value={filters.search}
              onChange={changeFilter}
              placeholder="Voucher, employee, title"
            />
          </div>

          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={filters.status} onChange={changeFilter}>
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="department">Department</label>
            <input id="department" name="department" value={filters.department} onChange={changeFilter} />
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <input id="category" name="category" value={filters.category} onChange={changeFilter} />
          </div>

          <div className="form-field">
            <label htmlFor="from">From date</label>
            <input id="from" name="from" type="date" value={filters.from} onChange={changeFilter} />
          </div>

          <div className="form-field">
            <label htmlFor="to">To date</label>
            <input id="to" name="to" type="date" value={filters.to} onChange={changeFilter} />
          </div>

          <div className="form-field">
            <label htmlFor="minAmount">Minimum amount (₹)</label>
            <input id="minAmount" name="minAmount" type="number" min="0" value={filters.minAmount} onChange={changeFilter} />
          </div>

          <div className="form-field">
            <label htmlFor="maxAmount">Maximum amount (₹)</label>
            <input id="maxAmount" name="maxAmount" type="number" min="0" value={filters.maxAmount} onChange={changeFilter} />
          </div>

          <div className="form-field">
            <label htmlFor="sort">Sort by</label>
            <select id="sort" name="sort" value={filters.sort} onChange={changeFilter}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Amount: low to high</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="primary-button filter-button" type="submit">Apply Filters</button>
            <button className="secondary-button" type="button" onClick={() => {
              resetFilters();
              setTimeout(() => {
                getVouchers().then((result) => setVouchers(result.vouchers || []))
                  .catch(() => setError("Unable to reset filters."));
              }, 0);
            }}>Reset</button>
            <button className="secondary-button" type="button" onClick={loadVouchers}>
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        {loading ? <p>Loading vouchers...</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Expense</th>
                  <th>Category</th>
                  <th>Expense Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v._id}>
                    <td>{v.voucherNumber}</td>
                    <td>{v.employee?.name || "—"}</td>
                    <td>{v.department}</td>
                    <td>{v.expenseTitle}</td>
                    <td>{v.category}</td>
                    <td>{v.expenseDate ? new Date(v.expenseDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td>{Number(v.amount || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" })}</td>
                    <td>
                      <span className={`status-badge status-${v.status.toLowerCase()}`}>
                        {v.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td>{v.rejectionReason || "—"}</td>
                  </tr>
                ))}
                {vouchers.length === 0 && (
                  <tr><td colSpan="9">No vouchers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
