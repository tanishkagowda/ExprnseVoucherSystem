
import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  FileText,
  CalendarDays,
  IndianRupee,
  UserRound,
  Building2
} from "lucide-react";

import { getVouchers } from "../services/voucherService";
import VoucherSignature from "../components/VoucherSignature";

const initialFilters = {
  search: "",
  status: "",
  department: "",
  category: "",
  from: "",
  to: "",
  minAmount: "",
  maxAmount: "",
  sort: "newest"
};

const statusLabels = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected"
};

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatAmount(amount) {
  return Number(amount || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  });
}

function getEmployeeName(voucher) {
  return voucher.employee?.name || "Unknown employee";
}

export default function AccountsVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadVouchers(activeFilters = filters) {
    try {
      setLoading(true);
      setError("");

      const params = {};

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== "" && value !== null && value !== undefined) {
          params[key] = value;
        }
      });

      const result = await getVouchers(params);
      setVouchers(result.vouchers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load vouchers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers(initialFilters);
  }, []);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    loadVouchers(filters);
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    loadVouchers(initialFilters);
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="page-eyebrow">ACCOUNTS DEPARTMENT</p>
          <h1>All Expense Vouchers</h1>
          <p className="page-description">
            View voucher records, approval status, and signatures.
            This screen is read-only.
          </p>
        </div>

        <button
          type="button"
          className="secondary-link"
          onClick={() => loadVouchers()}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <section className="welcome-card">
        <div className="welcome-icon">
          <FileText size={26} />
        </div>

        <div>
          <h2>Voucher Register</h2>
          <p>
            {loading
              ? "Loading voucher records..."
              : `${vouchers.length} voucher record(s) found.`}
          </p>
        </div>
      </section>

      <section className="voucher-list-section">
        <div className="section-heading">
          <div>
            <h2>Voucher Records</h2>
            <p>Search, filter, and inspect expense vouchers.</p>
          </div>
        </div>

        <form
          className="advanced-filters"
          onSubmit={handleApplyFilters}
        >
          <div className="form-field">
            <label htmlFor="search">Search</label>
            <div className="search-input-wrap">
              <Search size={17} />
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Voucher no., employee, title..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">
                Pending Approval
              </option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              name="department"
              type="text"
              placeholder="Enter department"
              value={filters.department}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              name="category"
              type="text"
              placeholder="Enter category"
              value={filters.category}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="from">From date</label>
            <input
              id="from"
              name="from"
              type="date"
              value={filters.from}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="to">To date</label>
            <input
              id="to"
              name="to"
              type="date"
              value={filters.to}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="minAmount">Minimum amount (₹)</label>
            <input
              id="minAmount"
              name="minAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="maxAmount">Maximum amount (₹)</label>
            <input
              id="maxAmount"
              name="maxAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Any amount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="sort">Sort by</label>
            <select
              id="sort"
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Amount: low to high</option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              type="submit"
              className="primary-link"
              disabled={loading}
            >
              <Filter size={16} />
              Apply Filters
            </button>

            <button
              type="button"
              className="secondary-link"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message" role="alert">
            {error}
            <button
              type="button"
              className="secondary-link"
              onClick={() => loadVouchers()}
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={24} />
            <p>Loading vouchers...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="empty-state">
            <FileText size={32} />
            <h3>No vouchers found</h3>
            <p>
              Try changing your search terms or clearing the filters.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Voucher No.</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Expense Title</th>
                  <th>Expense Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {vouchers.map((voucher) => (
                  <tr key={voucher._id}>
                    <td>
                      <strong>{voucher.voucherNumber || "—"}</strong>
                    </td>

                    <td>{getEmployeeName(voucher)}</td>

                    <td>{voucher.department || "—"}</td>

                    <td>{voucher.expenseTitle || "—"}</td>

                    <td>{formatDate(voucher.expenseDate)}</td>

                    <td>{formatAmount(voucher.amount)}</td>

                    <td>
                      <span
                        className={`status-badge status-${(
                          voucher.status || "DRAFT"
                        ).toLowerCase()}`}
                      >
                        {statusLabels[voucher.status] ||
                          voucher.status ||
                          "Unknown"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="icon-link"
                        title="View voucher details"
                        aria-label={`View voucher ${voucher.voucherNumber}`}
                        onClick={() => setSelected(voucher)}
                      >
                        <Eye size={17} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <section
            className="review-modal accounts-voucher-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-details-title"
          >
            <div className="modal-header">
              <div>
                <p className="page-eyebrow">VOUCHER DETAILS</p>
                <h2 id="voucher-details-title">
                  {selected.voucherNumber || "Expense Voucher"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() => setSelected(null)}
                aria-label="Close voucher details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="review-summary">
              <div className="detail-item">
                <span>Expense Title</span>
                <strong>{selected.expenseTitle || "—"}</strong>
              </div>

              <div className="detail-item">
                <span>Amount</span>
                <strong>{formatAmount(selected.amount)}</strong>
              </div>

              <div className="detail-item">
                <span>Status</span>
                <strong>
                  {statusLabels[selected.status] ||
                    selected.status ||
                    "Unknown"}
                </strong>
              </div>
            </div>

            <div className="voucher-detail-grid">
              <div className="detail-item">
                <span>
                  <UserRound size={15} /> Employee Name
                </span>
                <strong>{getEmployeeName(selected)}</strong>
              </div>

              <div className="detail-item">
                <span>Employee ID</span>
                <strong>
                  {selected.employee?.employeeId || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span>
                  <Building2 size={15} /> Department
                </span>
                <strong>{selected.department || "—"}</strong>
              </div>

              <div className="detail-item">
                <span>Category</span>
                <strong>{selected.category || "—"}</strong>
              </div>

              <div className="detail-item">
                <span>
                  <CalendarDays size={15} /> Voucher Date
                </span>
                <strong>{formatDate(selected.voucherDate)}</strong>
              </div>

              <div className="detail-item">
                <span>Expense Date</span>
                <strong>{formatDate(selected.expenseDate)}</strong>
              </div>

              <div className="detail-item">
                <span>
                  <IndianRupee size={15} /> Amount
                </span>
                <strong>{formatAmount(selected.amount)}</strong>
              </div>

              <div className="detail-item">
                <span>Approval Date</span>
                <strong>{formatDate(selected.approvalDate)}</strong>
              </div>

              <div className="detail-item detail-item-wide">
                <span>Description</span>
                <p>{selected.description || "No description provided."}</p>
              </div>

              {selected.status === "REJECTED" && (
                <div className="detail-item detail-item-wide">
                  <span>Rejection Reason</span>
                  <p>
                    {selected.rejectionReason ||
                      "No rejection reason recorded."}
                  </p>
                </div>
              )}

              <div className="detail-item detail-item-wide">
                <span>Reviewed By</span>
                <strong>
                  {selected.reviewedBy?.name || "—"}
                </strong>
              </div>
            </div>

            <div className="signature-section">
              <h3>Voucher Signatures</h3>

              <VoucherSignature
                voucherId={selected._id}
                kind="employee"
                label="Employee Signature"
              />

              <VoucherSignature
                voucherId={selected._id}
                kind="director"
                label="Director Approval Signature"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-link"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
