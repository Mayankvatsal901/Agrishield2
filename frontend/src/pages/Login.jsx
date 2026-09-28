import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { Field, Notice, Spinner } from "../components/ui.jsx";
import AuthArt from "./AuthArt.jsx";
import Brand from "../components/Brand.jsx";
import PasswordInput from "../components/PasswordInput.jsx";

export default function Login() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.login(form);
      signIn(res.token, res.user);
      nav(loc.state?.from || "/app", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthArt quote="Every rupee agreed, on the record." />
      <div className="auth-form">
        <div>
          <h1>Sign in</h1>
          <p className="muted" style={{ marginBottom: "1.75rem" }}>
            New here? <Link to="/register">Create an account</Link>
          </p>
          <form onSubmit={submit} className="stack" noValidate>
            {error && (
              <Notice tone="bad" title="Couldn't sign you in">
                {error}
                {/verify your email/i.test(error) && (
                  <div className="small" style={{ marginTop: 4 }}>
                    Your account needs email verification before you can sign in again.
                  </div>
                )}
              </Notice>
            )}
            <Field label="Email" htmlFor="email">
              <input id="email" className="input" type="email" autoComplete="email" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password" htmlFor="password">
              <PasswordInput id="password" autoComplete="current-password" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <button className="btn btn-ink btn-block" disabled={busy || !form.email || !form.password}>
              {busy && <Spinner />} Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}