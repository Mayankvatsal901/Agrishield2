import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import Brand from "../components/Brand.jsx";
import ProfileFields, { emptyProfile, validate } from "../components/ProfileFields.jsx";
import { Loading, Notice, Spinner } from "../components/ui.jsx";

export default function Onboarding() {
  const { user, profile, loadProfile, signOut } = useAuth();
  const nav = useNavigate();
  const [value, setValue] = useState(emptyProfile);
  const [i, setI] = useState(0);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/app" replace />;
  if (profile === undefined) return <Loading label="Checking your account" />;
  if (profile) return <Navigate to="/app" replace />;

  const steps = [
    { key: "you", title: "About you", intro: "This is how the other side of a deal will know you." },
    { key: "language", title: "Your language", intro: "Pick the language you're most comfortable reading." },
    { key: "place", title: "Where you are", intro: user.role === "FARMER" ? "Buyers use this to find crops near them." : "Farmers use this to judge transport and delivery." },
    ...(user.role === "BUYER" ? [{ key: "business", title: "Your business", intro: "Helps farmers know who they're selling to." }] : []),
  ];
  const step = steps[i];
  const last = i === steps.length - 1;

  const next = async (e) => {
    e.preventDefault();
    const errs = validate(step.key, value, user.role);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!last) return setI(i + 1);
    setBusy(true);
    setError("");
    try {
      await api.createProfile(value);
      await loadProfile();
      nav(user.role === "FARMER" ? "/app/kyc" : "/app/market", { replace: true });
    } catch (err) {
      setError(err.message.includes("duplicate key") && err.message.includes("phone")
        ? "That mobile number is already used by another account."
        : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow" style={{ paddingTop: "1.5rem" }}>
      <div className="row between" style={{ marginBottom: "2.5rem" }}>
        <Brand />
        <button className="btn btn-link small" onClick={signOut}>Sign out</button>
      </div>

      <ol className="steps" aria-label="Setup progress">
        {steps.map((s, n) => (
          <li key={s.key} className={n < i ? "done" : n === i ? "current" : ""} aria-current={n === i ? "step" : undefined}>
            <div className="bar" />
            <div className="txt">{s.title}</div>
          </li>
        ))}
      </ol>

      <form onSubmit={next} className="panel" style={{ padding: "1.75rem" }} noValidate>
        <h1 style={{ fontSize: "var(--step-3)" }}>{step.title}</h1>
        <p className="muted" style={{ margin: "0.4rem 0 1.5rem" }}>{step.intro}</p>
        {error && <div style={{ marginBottom: "1rem" }}><Notice tone="bad" title="Couldn't save your profile">{error}</Notice></div>}
        <ProfileFields section={step.key} value={value} onChange={setValue} errors={errors} role={user.role} />
        <div className="row between" style={{ marginTop: "1.75rem" }}>
          {i > 0 ? <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}>Back</button> : <span />}
          <button className={`btn ${user.role === "BUYER" ? "btn-indigo" : "btn-primary"}`} disabled={busy}>
            {busy && <Spinner />} {last ? "Finish setup" : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
