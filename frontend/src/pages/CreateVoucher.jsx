
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Send } from "lucide-react";
import {
  createVoucher,
  getVoucher,
  updateVoucher,
  uploadEmployeeSignature,
  submitVoucher,
} from "../services/voucherService";

const initialForm = {
  department: "",
  expenseTitle: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  category: "",
  description: "",
  amount: "",
};

export default function CreateVoucher() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [signature, setSignature] = useState(null);
  const [submitNow, setSubmitNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditing);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isEditing) return;

    async function loadDraft() {
      try {
        const data = await getVoucher(id);
        const voucher = data.voucher;

        if (!voucher || voucher.status !== "DRAFT") {
          setError("Only draft vouchers can be edited.");
          return;
        }

        setForm({
          department: voucher.department || "",
          expenseTitle: voucher.expenseTitle || "",
          expenseDate: voucher.expenseDate
            ? new Date(voucher.expenseDate).toISOString().slice(0, 10)
            : "",
          category: voucher.category || "",
          description: voucher.description || "",
          amount: voucher.amount ?? "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load the voucher.");
      } finally {
        setPageLoading(false);
      }
    }

    loadDraft();
  }, [id, isEditing]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.department.trim() || !form.expenseTitle.trim() ||
        !form.expenseDate || !form.category.trim() || Number(form.amount) <= 0) {
      setError("Please complete all required fields and enter an amount greater than zero.");
      return;
    }

    if (submitNow && !signature) {
      setError("Upload your signature before submitting for approval.");
      return;
    }

    setLoading(true);

    try {
      let voucherId = id;

      if (isEditing) {
        await updateVoucher(id, form);
      } else {
        const result = await createVoucher(form);
        voucherId = result.voucher?._id || result._id;
      }

      if (submitNow) {
        await uploadEmployeeSignature(voucherId, signature);
        await submitVoucher(voucherId);
        setMessage("Voucher submitted for approval successfully.");
      } else {
        setMessage("Draft saved successfully.");
      }

      setTimeout(() => navigate("/employee/vouchers"), 700);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the voucher.");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) return <main className="dashboard-page">Loading draft...</main>;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">EMPLOYEE WORKSPACE</p>
          <h1>{isEditing ? "Edit Draft Voucher" : "Create Expense Voucher"}</h1>
          <p className="muted">Fields marked * are required.</p>
        </div>
        <Link className="secondary-link" to="/employee/vouchers">
          <ArrowLeft size={17} /> Back to vouchers
        </Link>
      </header>

      <form className="voucher-form welcome-card" onSubmit={handleSave}>
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <div className="form-section-title">
          <h2>Expense Information</h2>
          <p className="muted">Enter the details of the expense being claimed.</p>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="department">Department *</label>
            <input
              id="department"
              name="department"
              value={form.department}
              onChange={updateField}
              placeholder="e.g. IT"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="expenseTitle">Expense Title *</label>
            <input
              id="expenseTitle"
              name="expenseTitle"
              value={form.expenseTitle}
              onChange={updateField}
              placeholder="e.g. Client meeting travel"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="expenseDate">Expense Date *</label>
            <input
              id="expenseDate"
              type="date"
              name="expenseDate"
              value={form.expenseDate}
              onChange={updateField}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={updateField}
              required
            >
              <option value="">Select a category</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food and Meals</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Communication">Communication</option>
              <option value="Training">Training</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="amount">Amount (₹) *</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={updateField}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-field form-field-wide">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={updateField}
              placeholder="Explain the business purpose of this expense"
              rows={4}
            />
          </div>
        </div>

        <div className="form-section-title signature-section">
          <h2>Employee Signature</h2>
          <p className="muted">
            A PNG or JPEG image up to 2 MB is accepted. Required before submission.
          </p>
        </div>

        <div className="form-field">
          <label htmlFor="signature">Signature image</label>
          <input
            id="signature"
            type="file"
            accept="image/png,image/jpeg"
            onChange={(event) => setSignature(event.target.files?.[0] || null)}
            required={submitNow}
          />
          {signature && (
            <p className="muted">Selected file: {signature.name}</p>
          )}
        </div>

        <label className="submit-option">
          <input
            type="checkbox"
            checked={submitNow}
            onChange={(event) => setSubmitNow(event.target.checked)}
          />
          Submit for approval now (requires a signature)
        </label>

        <div className="form-actions">
          <Link className="secondary-link" to="/employee/vouchers">
            Cancel
          </Link>

          <button className="primary-button form-submit" type="submit" disabled={loading}>
            {submitNow ? <Send size={17} /> : <Save size={17} />}
            {loading
              ? "Saving..."
              : submitNow
                ? "Save and Submit"
                : "Save as Draft"}
          </button>
        </div>
      </form>
    </main>
  );
}
