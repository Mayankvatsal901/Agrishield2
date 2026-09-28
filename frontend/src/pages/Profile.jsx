import { useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import ProfileFields, { fromServer, validate } from "../components/ProfileFields.jsx";
import { Notice, Spinner, useToast } from "../components/ui.jsx";

export default function Profile() {
  const { user, profile, buyerProfile, setProfile, setBuyerProfile } = useAuth();
  const toast = useToast();
  const [value, setValue] = useState(() => fromServer(profile, buyerProfile));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async (e) => {
    e.preventDefault();
    const errs = validate("all", value, user.role);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.updateProfile(value);
      setProfile(res.data.profile);
      if (res.data.buyerProfile) setBuyerProfile(res.data.buyerProfile);
      toast("Profile saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p>{user.role === "FARMER" ? "Farmer account" : "Buyer account"}{user.email ? ` for ${user.email}` : ""}</p>
        </div>
      </div>
      <form onSubmit={save} className="stack" style={{ "--gap": "1.25rem" }} noValidate>
        {error && <Notice tone="bad" title="Couldn't save">{error}</Notice>}
        <section className="panel stack">
          <h2 style={{ fontSize: "var(--step-1)" }}>About you</h2>
          <ProfileFields section="you" value={value} onChange={setValue} errors={errors} role={user.role} />
        </section>
        <section className="panel">
          <ProfileFields section="language" value={value} onChange={setValue} errors={errors} role={user.role} />
          <p className="small faint" style={{ marginTop: "0.75rem" }}>
            Deal rooms you've already opened keep the language they started with.
          </p>
        </section>
        <section className="panel stack">
          <h2 style={{ fontSize: "var(--step-1)" }}>Location</h2>
          <ProfileFields section="place" value={value} onChange={setValue} errors={errors} role={user.role} />
        </section>
        {user.role === "BUYER" && (
          <section className="panel stack">
            <h2 style={{ fontSize: "var(--step-1)" }}>Business</h2>
            <ProfileFields section="business" value={value} onChange={setValue} errors={errors} role={user.role} />
          </section>
        )}
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn btn-ink" disabled={busy}>{busy && <Spinner />} Save changes</button>
        </div>
      </form>
    </div>
  );
}
