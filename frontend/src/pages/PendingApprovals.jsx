
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getVouchers } from "../services/voucherService";
import VoucherSignature from "../components/VoucherSignature";
import "../styles.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getEmployeeName(voucher) {
  return voucher.employee?.name || "Unknown employee";
}

export default function PendingApprovals() {
  const [vouchers, setVouchers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const [signature, setSignature] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalMode, setModalMode] = useState(null);

  const loadPendingVouchers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getVouchers({
        status: "PENDING_APPROVAL",
        sort: "oldest"
      });

      setVouchers(response.vouchers || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load pending vouchers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingVouchers();
  }, [loadPendingVouchers]);

  const filteredVouchers = vouchers.filter((voucher) => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) return true;

    const searchableValues = [
      voucher.voucherNumber,
      voucher.expenseTitle,
      voucher.department,
      voucher.category,
      getEmployeeName(voucher),
      voucher.employee?.employeeId
    ];

    return searchableValues.some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    );
  });

  function openReviewModal(voucher, mode) {
    setSelected(voucher);
    setModalMode(mode);
    setSignature(null);
    setRejectionReason("");
    setError("");
    setSuccess("");
  }

  function closeReviewModal() {
    if (processing) return;

    setSelected(null);
    setModalMode(null);
    setSignature(null);
    setRejectionReason("");
  }

  async function handleApprove(event) {
    event.preventDefault();

    if (!selected) return;

    if (!signature) {
      setError("Please upload the Director's approval signature.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("signature", signature);

      await api.patch(
        `/vouchers/${selected._id}/approve`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setSuccess(
        `Voucher ${selected.voucherNumber} approved successfully.`
      );

      setSelected(null);
      setModalMode(null);
      setSignature(null);

      await loadPendingVouchers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to approve this voucher."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject(event) {
    event.preventDefault();

    if (!selected) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      setError("Please enter a rejection reason.");
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      await api.patch(`/vouchers/${selected._id}/reject`, {
        reason
      });

      setSuccess(
        `Voucher ${selected.voucherNumber} rejected successfully.`
      );

      setSelected(null);
      setModalMode(null);
      setRejectionReason("");

      await loadPendingVouchers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reject this voucher."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <div className="brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h1>Expense Voucher System</h1>
            <p>Director Approval Centre</p>
          </div>
        </div>

        <Link to="/director" className="secondary-link">
          <ArrowLeft size={17} />
          Director Dashboard
        </Link>
      </header>

      <section className="dashboard-content">
        <div className="welcome-card">
          <div>
            <span className="eyebrow">DIRECTOR WORKSPACE</span>
            <h2>Pending Approvals</h2>
            <p>
              Review employee expense vouchers, verify signatures,
              and approve or reject submissions.
            </p>
          </div>

          <div className="welcome-icon">
            <Clock size={34} />
          </div>
        </div>

        {error && !selected && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message" role="status">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <div className="action-bar">
          <div className="search-box">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search voucher, employee, department..."
              aria-label="Search pending vouchers"
            />
          </div>

          <button
            type="button"
            className="secondary-link"
            onClick={loadPendingVouchers}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Vouchers awaiting approval</h3>
              <p>
                {filteredVouchers.length} voucher
                {filteredVouchers.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <LoaderCircle className="spin" size={25} />
              <p>Loading pending vouchers...</p>
            </div>
          ) : filteredVouchers.length === 0 ? (
            <div className="empty-state">
              <FileText size={38} />
              <h3>No pending vouchers found</h3>
              <p>
                New submissions will appear here when employees
                submit their vouchers.
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
                    <th>Expense</th>
                    <th>Expense Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVouchers.map((voucher) => (
                    <tr key={voucher._id}>
                      <td>
                        <strong>{voucher.voucherNumber}</strong>
                      </td>

                      <td>
                        <div className="table-primary">
                          {getEmployeeName(voucher)}
                        </div>
                        <small>
                          {voucher.employee?.employeeId || "—"}
                        </small>
                      </td>

                      <td>{voucher.department || "—"}</td>

                      <td>
                        <div className="table-primary">
                          {voucher.expenseTitle}
                        </div>
                        <small>{voucher.category}</small>
                      </td>

                      <td>{formatDate(voucher.expenseDate)}</td>

                      <td>
                        <strong>
                          {formatCurrency(voucher.amount)}
                        </strong>
                      </td>

                      <td>
                        <span className="status-badge pending">
                          Pending Approval
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="secondary-link"
                            onClick={() =>
                              openReviewModal(voucher, "review")
                            }
                          >
                            Review
                          </button>

                          <button
                            type="button"
                            className="approve-button"
                            onClick={() =>
                              openReviewModal(voucher, "approve")
                            }
                          >
                            <CheckCircle size={15} />
                            Approve
                          </button>

                          <button
                            type="button"
                            className="reject-button"
                            onClick={() =>
                              openReviewModal(voucher, "reject")
                            }
                          >
                            <XCircle size={15} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !processing
            ) {
              closeReviewModal();
            }
          }}
        >
          <section
            className="review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">VOUCHER REVIEW</span>
                <h2 id="review-modal-title">
                  {selected.voucherNumber}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeReviewModal}
                disabled={processing}
                aria-label="Close review modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="review-summary">
              <div>
                <span>Employee</span>
                <strong>{getEmployeeName(selected)}</strong>
              </div>

              <div>
                <span>Employee ID</span>
                <strong>
                  {selected.employee?.employeeId || "—"}
                </strong>
              </div>

              <div>
                <span>Department</span>
                <strong>{selected.department || "—"}</strong>
              </div>

              <div>
                <span>Expense category</span>
                <strong>{selected.category || "—"}</strong>
              </div>

              <div>
                <span>Expense title</span>
                <strong>{selected.expenseTitle || "—"}</strong>
              </div>

              <div>
                <span>Expense date</span>
                <strong>{formatDate(selected.expenseDate)}</strong>
              </div>

              <div>
                <span>Voucher date</span>
                <strong>{formatDate(selected.voucherDate)}</strong>
              </div>

              <div>
                <span>Amount claimed</span>
                <strong>{formatCurrency(selected.amount)}</strong>
              </div>

              <div className="review-summary-wide">
                <span>Description</span>
                <p>{selected.description || "No description provided."}</p>
              </div>
            </div>

            <div className="signature-section">
              <h3>Employee Signature Verification</h3>

              <p>
                Verify the employee's uploaded signature before
                approving the voucher.
              </p>

              <VoucherSignature
                voucherId={selected._id}
                kind="employee"
                label="Employee Signature"
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            {modalMode === "reject" ? (
              <form onSubmit={handleReject}>
                <div className="form-field">
                  <label htmlFor="rejectionReason">
                    Rejection reason *
                  </label>

                  <textarea
                    id="rejectionReason"
                    rows={4}
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    placeholder="Explain why this voucher is being rejected..."
                    required
                    minLength={3}
                    maxLength={1000}
                    disabled={processing}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-link"
                    onClick={closeReviewModal}
                    disabled={processing}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="reject-submit"
                    disabled={processing}
                  >
                    {processing ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <XCircle size={17} />
                    )}

                    {processing ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </form>
            ) : modalMode === "approve" ? (
              <form onSubmit={handleApprove}>
                <div className="form-field">
                  <label htmlFor="directorSignature">
                    Director Approval Signature *
                  </label>

                  <input
                    id="directorSignature"
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={(event) =>
                      setSignature(event.target.files?.[0] || null)
                    }
                    required
                    disabled={processing}
                  />

                  <small>
                    Upload a PNG or JPEG image, up to 2 MB.
                  </small>

                  {signature && (
                    <small>
                      Selected file: {signature.name}
                    </small>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-link"
                    onClick={closeReviewModal}
                    disabled={processing}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="approve-button"
                    disabled={processing}
                  >
                    {processing ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <CheckCircle size={17} />
                    )}

                    {processing ? "Approving..." : "Confirm Approval"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-link"
                  onClick={closeReviewModal}
                >
                  Close Review
                </button>

                <button
                  type="button"
                  className="approve-button"
                  onClick={() => setModalMode("approve")}
                >
                  <CheckCircle size={17} />
                  Approve Voucher
                </button>

                <button
                  type="button"
                  className="reject-button"
                  onClick={() => setModalMode("reject")}
                >
                  <XCircle size={17} />
                  Reject Voucher
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
