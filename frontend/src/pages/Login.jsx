
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";
import { ReceiptText, ShieldCheck } from "lucide-react";
import "../styles.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await loginUser(email, password);

      if (user.role === "EMPLOYEE") {
        navigate("/employee");
      } else if (user.role === "DIRECTOR") {
        navigate("/director");
      } else if (user.role === "ACCOUNTS") {
        navigate("/accounts");
      } else {
        setError("Your account role is not recognized.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-icon">
          <ReceiptText size={32} />
        </div>
        <p className="eyebrow">PRACHAY SECURITIES PRIVATE LIMITED</p>
        <h1>Expense Voucher Management</h1>
        <p className="brand-description">
          Submit, review and track company expense vouchers through one
          organized approval workflow.
        </p>

        <div className="feature-line">
          <ShieldCheck size={19} />
          <span>Role-based access and approval tracking</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="muted">
            Use the account provided for your role.
          </p>

          {error && <div className="error-message">{error}</div>}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-footer">
            Access is restricted to authorized company users.
          </p>
        </form>
      </section>
    </main>
  );
}
