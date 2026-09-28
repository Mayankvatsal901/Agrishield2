import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBasket, Sprout } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { Field, Notice, Spinner } from "../components/ui.jsx";
import AuthArt from "./AuthArt.jsx";
import Brand from "../components/Brand.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

const fromLink = (value) => (value === "BUYER" || value === "FARMER" ? value : "");

export default function Register() {
  const [params] = useSearchParams();
  const { signIn } = useAuth();
  const nav = useNavigate();

  // If they came from "Start selling" / "Start buying", the role is already chosen.
  const linkedRole = fromLink(params.get("role"));
  const [role, setRole] = useState(linkedRole);
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const tooShort = form.password && form.password.length < 6;
  const isBuyer = role === "BUYER";
  const otherRole = isBuyer ? "FARMER" : "BUYER";

  const submit = async (e) => {
    e.preventDefault();
    if (!role) return setError("Choose whether you grow or buy crops.");
    setBusy(true);
    setError("");
    try {
      const res = await api.register({ ...form, role });
      signIn(res.token, res.user);
      nav("/onboarding", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchRole = () => {
    setRole(otherRole);
    nav(`/register?role=${otherRole}`, { replace: true });
  };

  return (
    <div className="auth">
      <AuthArt quote={isBuyer ? "Buy straight from the field." : "Your crop. Your price. Your language."} />
      <div className="auth-form">
        <div>
          <div style={{ marginBottom: "2rem" }}><Brand /></div>

          <h1>
            {role === "FARMER" && linkedRole ? "Create your farmer account"
              : role === "BUYER" && linkedRole ? "Create your buyer account"
              : "Create your account"}
          </h1>

          {linkedRole ? (
            <p className="muted" style={{ marginBottom: "1.75rem" }}>
              {isBuyer ? "Buy crops directly from verified farmers." : "List what you grow and get offers from buyers."}{" "}
              <button type="button" className="btn-link" onClick={switchRole}>
                {isBuyer ? "I grow crops instead" : "I buy crops instead"}
              </button>
              <br />
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          ) : (
            <p className="muted" style={{ marginBottom: "1.75rem" }}>
              Already have one? <Link to="/login">Sign in</Link>
            </p>
          )}

          <form onSubmit={submit} className="stack" noValidate>
            {!linkedRole && (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="label" style={{ marginBottom: "0.5rem" }}>I want to</legend>
                <div className="role-pick">
                  <button type="button" className="role-card farmer" aria-pressed={role === "FARMER"} onClick={() => setRole("FARMER")}>
                    <Sprout aria-hidden="true" />
                    <strong>Sell crops</strong>
                    <span>List what you grow and get offers</span>
                  </button>
                  <button type="button" className="role-card buyer" aria-pressed={role === "BUYER"} onClick={() => setRole("BUYER")}>
                    <ShoppingBasket aria-hidden="true" />
                    <strong>Buy crops</strong>
                    <span>Source directly from farmers</span>
                  </button>
                </div>
              </fieldset>
            )}

            {error && <Notice tone="bad">{error}</Notice>}

            <Field label="Email" htmlFor="email">
              <input id="email" className="input" type="email" autoComplete="email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password" htmlFor="password" hint="At least 6 characters" error={tooShort ? "Use at least 6 characters" : ""}>
              <PasswordInput id="password" autoComplete="new-password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>

            <button className={`btn btn-block ${isBuyer ? "btn-indigo" : "btn-primary"}`}
              disabled={busy || !role || !form.email || form.password.length < 6}>
              {busy && <Spinner />}{" "}
              {role === "FARMER" ? "Create farmer account" : role === "BUYER" ? "Create buyer account" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}