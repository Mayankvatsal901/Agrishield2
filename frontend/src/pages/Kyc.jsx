import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, FileImage, ScanText, ShieldCheck, Upload, X } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { date } from "../lib/format.js";
import { DocPicker } from "../components/ImagePicker.jsx";
import { Loading, Notice, Pill, Spinner, useToast } from "../components/ui.jsx";

function mask(n = "") {
  const d = String(n).replace(/\s/g, "");
  return d.length >= 4 ? `XXXX XXXX ${d.slice(-4)}` : n || "—";
}

export function OcrSummary({ ocr }) {
  if (!ocr) return null;
  const a = ocr.aadhaar || {};
  const p = ocr.pan || {};
  return (
    <div className="ocr">
      <div className="panel-flat">
        <h3 style={{ fontSize: "1rem", marginBottom: "0.6rem" }}>Read from Aadhaar</h3>
        <dl>
          <dt>Name</dt><dd>{a.name || "—"}</dd>
          <dt>Number</dt><dd>{mask(a.aadhaarNumber)}</dd>
          <dt>Date of birth</dt><dd>{a.dob || "—"}</dd>
          <dt>Gender</dt><dd>{a.gender || "—"}</dd>
        </dl>
      </div>
      <div className="panel-flat">
        <h3 style={{ fontSize: "1rem", marginBottom: "0.6rem" }}>Read from PAN</h3>
        <dl>
          <dt>Name</dt><dd>{p.name || "—"}</dd>
          <dt>PAN</dt><dd>{p.panNumber || "—"}</dd>
          <dt>Father's name</dt><dd>{p.fatherName || "—"}</dd>
          <dt>Date of birth</dt><dd>{p.dob || "—"}</dd>
        </dl>
      </div>
    </div>
  );
}

/* One uploaded document, with what was read from it. */
function DocCard({ title, image, rows, readFailed }) {
  return (
    <section className="doc-card">
      <div className="doc-card-head">
        <h3>{title}</h3>
        <span className="doc-ok"><Check aria-hidden="true" /> Uploaded</span>
      </div>
      <div className="doc-card-img">
        {image ? <img src={image} alt={`${title} as you uploaded it`} /> : <FileImage aria-hidden="true" />}
      </div>
      {readFailed ? (
        <p className="small muted">We couldn't read this photo automatically. A reviewer will check it by hand.</p>
      ) : rows ? (
        <div>
          <p className="small muted" style={{ marginBottom: "0.3rem" }}>Read from your photo. Check these match your card.</p>
          <dl className="doc-rows">
            {rows.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}

export default function Kyc() {
  const { user } = useAuth();
  const toast = useToast();
  const [kyc, setKyc] = useState(null);
  const [error, setError] = useState("");
  const [files, setFiles] = useState({ aadhaarFront: null, aadhaarBack: null, panCard: null });
  const [busy, setBusy] = useState(false);
  const [redo, setRedo] = useState(false);

  const load = () => api.getKyc().then((r) => setKyc(r.data)).catch((e) => { setError(e.message); setKyc({ status: "NOT_SUBMITTED" }); });
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData();
    Object.entries(files).forEach(([k, f]) => form.append(k, f));
    try {
      await api.submitKyc(form);
      toast("Documents submitted for review");
      setRedo(false);
      setFiles({ aadhaarFront: null, aadhaarBack: null, panCard: null });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!kyc) return <Loading label="Checking verification" />;

  const s = kyc.status;
  const farmer = user.role === "FARMER";
  const submitted = s !== "NOT_SUBMITTED";
  const showForm = !submitted || s === "REJECTED" || redo;
  const ready = files.aadhaarFront && files.aadhaarBack && files.panCard;
  const ocrDone = kyc.ocrStatus === "COMPLETED";
  const ocrFailed = kyc.ocrStatus === "FAILED";
  const a = kyc.ocrData?.aadhaar || {};
  const p = kyc.ocrData?.pan || {};

  const steps = [
    {
      label: "Upload photos",
      sub: submitted && kyc.lastSubmittedAt ? `Sent ${date(kyc.lastSubmittedAt)}` : "Aadhaar and PAN",
      done: submitted, now: !submitted, icon: <Upload />,
    },
    {
      label: "Details read",
      sub: ocrFailed ? "Checked by hand instead" : ocrDone ? `${Math.round(kyc.ocrConfidence || 0)}% sure` : "Happens automatically",
      done: ocrDone, now: submitted && !ocrDone && !ocrFailed, fail: ocrFailed, icon: <ScanText />,
    },
    {
      label: "Team review",
      sub: s === "APPROVED" ? `Approved ${date(kyc.verifiedAt)}` : s === "REJECTED" ? "Not approved" : s === "PENDING" ? "Usually one working day" : "After you send them",
      done: s === "APPROVED", now: s === "PENDING", fail: s === "REJECTED", icon: <Clock />,
    },
    {
      label: farmer ? "Start selling" : "Verified",
      sub: farmer ? "List your first crop" : "Farmers see you're verified",
      done: s === "APPROVED", now: false, icon: <ShieldCheck />,
    },
  ];
  const stepIcon = (st) => (st.fail ? <X /> : st.done ? <Check /> : st.icon);

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <div className="page-head">
        <div>
          <h1>Verify your identity</h1>
          <p>
            {farmer
              ? "Buyers deal with you because they know you're real. You only do this once, and you can list crops as soon as it's approved."
              : "You only do this once. Farmers are more willing to deal with verified buyers."}
          </p>
        </div>
        {submitted && <Pill status={s} />}
      </div>

      <ol className="kyc-track">
        {steps.map((st, i) => (
          <li key={st.label} className={st.fail ? "fail" : st.done ? "done" : st.now ? "now" : ""}>
            <span className="kyc-dot" aria-hidden="true">{stepIcon(st)}</span>
            <div>
              <div className="kyc-track-label"><span className="sr-only">Step {i + 1}: </span>{st.label}</div>
              <div className="small muted">{st.sub}</div>
            </div>
          </li>
        ))}
      </ol>

      {s === "APPROVED" && (
        <Notice tone="ok" title="You're verified" action={farmer && <Link to="/app/listings/new" className="btn btn-sm btn-primary">List a crop</Link>}>
          {farmer ? "You can now list crops in the market." : "Farmers will see you as a verified buyer."}
        </Notice>
      )}
      {s === "PENDING" && !redo && (
        <Notice tone="warn" title="Our team is checking your documents">
          You'll see a message here once they're approved. If a detail below is wrong, upload new photos now so the check isn't held up.
        </Notice>
      )}
      {s === "REJECTED" && (
        <Notice tone="bad" title="Verification wasn't approved">
          {kyc.rejectionReason || "No reason was given."} Upload new photos below to try again.
        </Notice>
      )}

      {submitted && !showForm && (
        <section style={{ marginTop: "1.5rem" }}>
          <div className="kyc-docs">
            <DocCard
              title="Aadhaar card"
              image={kyc.documents?.aadhaar?.front}
              readFailed={ocrFailed}
              rows={kyc.ocrData && [
                ["Name", a.name],
                ["Aadhaar", a.aadhaarNumber ? `Ending ${String(a.aadhaarNumber).replace(/\s/g, "").slice(-4)}` : ""],
                ["Date of birth", a.dob],
                ["Gender", a.gender],
              ]}
            />
            <DocCard
              title="PAN card"
              image={kyc.documents?.pan?.image}
              readFailed={ocrFailed}
              rows={kyc.ocrData && [
                ["Name", p.name],
                ["PAN", p.panNumber],
                ["Father's name", p.fatherName],
                ["Date of birth", p.dob],
              ]}
            />
          </div>
          {s !== "APPROVED" && (
            <button className="btn btn-ghost" onClick={() => setRedo(true)} style={{ marginTop: "1rem" }}>
              Upload new photos
            </button>
          )}
        </section>
      )}

      {showForm && (
        <form onSubmit={submit} className="panel stack" style={{ marginTop: "1.5rem", "--gap": "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "var(--step-1)" }}>{submitted ? "Upload new photos" : "Upload your documents"}</h2>
            <p className="small muted" style={{ marginTop: "0.3rem" }}>Three photos: both sides of your Aadhaar and the front of your PAN card.</p>
          </div>
          {error && <Notice tone="bad" title="Couldn't submit">{error}</Notice>}
          <div className="doc-grid" style={{ alignItems: "start" }}>
            <DocPicker label="Aadhaar, front" file={files.aadhaarFront} onChange={(f) => setFiles({ ...files, aadhaarFront: f })} />
            <DocPicker label="Aadhaar, back" file={files.aadhaarBack} onChange={(f) => setFiles({ ...files, aadhaarBack: f })} />
            <DocPicker label="PAN card" file={files.panCard} onChange={(f) => setFiles({ ...files, panCard: f })} />
          </div>
          <ul className="kyc-tips">
            <li><b>Daylight, no flash.</b> Flash leaves glare over the numbers.</li>
            <li><b>All four corners.</b> Lay the card flat on a dark cloth.</li>
            <li><b>Hold still.</b> Blurry text can't be read.</li>
          </ul>
          <p className="small faint">Only AgriShield reviewers see these images. Your Aadhaar number is never shown to buyers.</p>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            {redo && <button type="button" className="btn btn-ghost" onClick={() => setRedo(false)}>Cancel</button>}
            <button className={`btn ${farmer ? "btn-primary" : "btn-indigo"}`} disabled={!ready || busy} style={{ minHeight: 54, paddingInline: "1.6rem" }}>
              {busy ? <><Spinner /> Reading documents…</> : "Send for review"}
            </button>
          </div>
          {busy && <p className="small muted" role="status">Reading the text on your documents can take up to a minute. Keep this page open.</p>}
        </form>
      )}
    </div>
  );
}