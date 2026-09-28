import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, FileUp, ShieldAlert, ShieldCheck } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import Brand from "../components/Brand.jsx";
import { Field, Notice, Spinner } from "../components/ui.jsx";

async function sha256(file) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Verify() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [cert, setCert] = useState(params.get("cert") || "");
  const [file, setFile] = useState(null);
  const [localHash, setLocalHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(null);
    if (!file || !window.crypto?.subtle) return setLocalHash("");
    sha256(file).then(setLocalHash).catch(() => setLocalHash(""));
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    setFile(f);
    const guess = f.name.match(/AGR-\d{4}-\d+/);
    if (guess && !cert) setCert(guess[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const form = new FormData();
    form.append("certificateNumber", cert.trim());
    form.append("pdf", file);
    try {
      setResult(await api.verify(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="public-head">
        <Brand to={user ? "/app" : "/"} />
        {user ? <Link to="/app" className="btn btn-ghost btn-sm">Back to app</Link> : <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>}
      </header>
      <div className="verify-wrap stack" style={{ "--gap": "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontStretch: "118%" }}>Check a contract</h1>
          <p className="muted" style={{ marginTop: "0.5rem", maxWidth: "58ch" }}>
            Every AgriShield contract has its fingerprint recorded on the Ethereum Sepolia blockchain.
            Upload the PDF you received to confirm it hasn't been changed since it was signed.
          </p>
        </div>

        <form onSubmit={submit} className="panel stack" style={{ "--gap": "1.1rem" }}>
          <Field label="Certificate number" htmlFor="cert" hint="Printed on the contract, for example AGR-2026-000001">
            <input id="cert" className="input num" value={cert} onChange={(e) => setCert(e.target.value.toUpperCase())} placeholder="AGR-2026-…" />
          </Field>
          <div className="field">
            <span className="label">Contract PDF</span>
            <label className="drop" style={{ minHeight: 120 }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}>
              <FileUp aria-hidden="true" />
              <span style={{ fontWeight: 600 }}>{file ? file.name : "Choose or drop the PDF"}</span>
              {file && <span className="small faint">{(file.size / 1024).toFixed(0)} KB</span>}
              <input type="file" accept="application/pdf" aria-label="Contract PDF" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
          </div>
          {localHash && (
            <div className="small">
              <span className="muted">This file's fingerprint: </span>
              <code style={{ wordBreak: "break-all", fontSize: "0.78rem" }}>{localHash}</code>
            </div>
          )}
          {error && <Notice tone="bad" title="Couldn't check this contract">{error}</Notice>}
          <button className="btn btn-ink" disabled={!file || !cert.trim() || busy}>{busy && <Spinner />} Check contract</button>
        </form>

        {result && (
          <section className="stack" style={{ "--gap": "1rem" }} aria-live="polite">
            <div className={`seal ${result.valid ? "ok" : "bad"}`}>
              <span className="seal-icon">{result.valid ? <ShieldCheck /> : <ShieldAlert />}</span>
              <div>
                <h2>{result.valid ? "This contract is genuine" : "This file doesn't match the record"}</h2>
                <p className="muted" style={{ marginTop: "0.25rem" }}>
                  {result.valid
                    ? `The PDF matches the fingerprint stored for ${result.certificateNumber}.`
                    : result.blockchainHash
                      ? "The PDF has been changed, or it belongs to a different certificate number."
                      : "No blockchain record was found for this certificate number."}
                </p>
              </div>
            </div>
            <div className="panel hash-compare">
              <div><span className="small muted">On the blockchain</span><code>{result.blockchainHash || "No record found"}</code></div>
              <div><span className="small muted">Your file</span><code>{result.uploadedHash}</code></div>
              <div><span className="small muted">Network</span><span>{result.network}</span></div>
              {result.explorerUrl && (
                <div><span /><a href={result.explorerUrl} target="_blank" rel="noreferrer" className="row" style={{ gap: "0.3rem" }}>
                  View the transaction on Etherscan <ExternalLink size={14} aria-hidden="true" />
                </a></div>
              )}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
