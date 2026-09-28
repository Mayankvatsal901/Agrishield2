import { useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { api } from "../lib/api.js";
import { ago, date, shortId } from "../lib/format.js";
import { Empty, Loading, Notice, Pill, Spinner, useToast } from "../components/ui.jsx";
import { OcrSummary } from "./Kyc.jsx";

const FILTERS = [
  { key: "PENDING", label: "Waiting" },
  { key: "APPROVED", label: "Approved" },
  { key: "REJECTED", label: "Rejected" },
  { key: "", label: "All" },
];

export default function AdminKyc() {
  const toast = useToast();
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = () => {
    setList(null);
    setError("");
    api.adminKycList({ status, page, limit: 20 })
      .then((r) => setList(r))
      .catch((e) => { setError(e.message); setList({ data: [], pagination: {} }); });
  };
  useEffect(load, [status, page]);

  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <div className="page-head">
        <div>
          <h1>KYC review</h1>
          <p>Compare the uploaded documents with what was read automatically, then approve or reject.</p>
        </div>
        <div className="segmented" role="group" aria-label="Status">
          {FILTERS.map((f) => (
            <button key={f.key} aria-pressed={status === f.key} onClick={() => { setStatus(f.key); setPage(1); setSelected(null); }}>{f.label}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ marginBottom: "1rem" }}><Notice tone="bad" title="Couldn't load submissions">{error}</Notice></div>}

      <div className="admin-split">
        <div>
          {!list ? <Loading /> : list.data.length === 0 ? (
            <Empty icon={ShieldCheck} title={status === "PENDING" ? "Nothing waiting for review" : "No submissions here"}>
              New KYC submissions appear here as farmers and buyers upload them.
            </Empty>
          ) : (
            <div className="list">
              {list.data.map((k) => (
                <button key={k._id} className="queue-item" aria-current={selected === String(k.userId)} onClick={() => setSelected(String(k.userId))}>
                  <div>
                    <div className="list-title">User {shortId(k.userId)}</div>
                    <div className="list-sub">Submitted {ago(k.lastSubmittedAt)}</div>
                  </div>
                  <Pill status={k.status} />
                </button>
              ))}
            </div>
          )}
          {list?.pagination?.totalPages > 1 && (
            <div className="pager">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="small muted num">{page} / {list.pagination.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= list.pagination.totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </div>

        {selected ? (
          <Review key={selected} userId={selected} onDecided={(msg) => { toast(msg); load(); }} />
        ) : (
          <div className="panel muted" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>Choose a submission to review it.</div>
        )}
      </div>
    </div>
  );
}

function Review({ userId, onDecided }) {
  const [kyc, setKyc] = useState(null);
  const [person, setPerson] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    api.adminKycDetail(userId).then((r) => setKyc(r.data)).catch((e) => setError(e.message));
    api.userById(userId).then((r) => setPerson(r.data)).catch(() => {});
  }, [userId]);

  const decide = async (action) => {
    setBusy(action);
    setError("");
    try {
      if (action === "approve") await api.adminApprove(userId);
      else await api.adminReject(userId, reason.trim());
      const r = await api.adminKycDetail(userId);
      setKyc(r.data);
      setRejecting(false);
      onDecided(action === "approve" ? "KYC approved" : "KYC rejected");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  if (error && !kyc) return <Notice tone="bad">{error}</Notice>;
  if (!kyc) return <Loading />;

  const docs = [
    ["Aadhaar front", kyc.documents?.aadhaar?.front],
    ["Aadhaar back", kyc.documents?.aadhaar?.back],
    ["PAN card", kyc.documents?.pan?.image],
  ];
  const nameOnProfile = person?.fullName?.trim().toLowerCase();
  const nameOnAadhaar = kyc.ocrData?.aadhaar?.name?.trim().toLowerCase();
  const nameOnPan = kyc.ocrData?.pan?.name?.trim().toLowerCase();
  const namesMatch = nameOnProfile && (nameOnAadhaar === nameOnProfile || nameOnPan === nameOnProfile);

  return (
    <section className="panel stack" style={{ "--gap": "1.25rem" }}>
      <div className="row between">
        <div>
          <h2>{person?.fullName || `User ${shortId(userId)}`}</h2>
          <p className="small muted">
            {person ? [person.address?.district, person.address?.state].filter(Boolean).join(", ") : "Profile not found"}
            {kyc.lastSubmittedAt ? `. Submitted ${date(kyc.lastSubmittedAt)}` : ""}
          </p>
        </div>
        <Pill status={kyc.status} />
      </div>

      <div className="doc-grid">
        {docs.map(([label, src]) => (
          <figure key={label} style={{ margin: 0 }}>
            <a href={src} target="_blank" rel="noreferrer">{src ? <img src={src} alt={label} /> : null}</a>
            <figcaption className="small muted" style={{ marginTop: 4 }}>{label}</figcaption>
          </figure>
        ))}
      </div>

      <div className="row between">
        <h3>Read automatically</h3>
        <span className="small muted">
          {kyc.ocrStatus === "COMPLETED" ? `${Math.round(kyc.ocrConfidence || 0)}% confidence` : `Reading ${String(kyc.ocrStatus || "").toLowerCase().replace("_", " ")}`}
        </span>
      </div>
      <OcrSummary ocr={kyc.ocrData} />
      {person && nameOnProfile && (nameOnAadhaar || nameOnPan) && (
        <Notice tone={namesMatch ? "ok" : "warn"}>
          {namesMatch ? "The name on the profile matches the documents." : `The profile name "${person.fullName}" doesn't exactly match the documents. Check the images.`}
        </Notice>
      )}
      {kyc.status === "REJECTED" && kyc.rejectionReason && <Notice tone="bad" title="Rejection reason">{kyc.rejectionReason}</Notice>}
      {error && <Notice tone="bad">{error}</Notice>}

      {rejecting ? (
        <div className="stack" style={{ "--gap": "0.75rem" }}>
          <label className="label" htmlFor="reason">Reason, shown to the user</label>
          <textarea id="reason" className="textarea" value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="For example: The Aadhaar back photo is blurred. Please upload a clearer photo." />
          <div className="row">
            <button className="btn btn-danger" disabled={!reason.trim() || !!busy} onClick={() => decide("reject")}>{busy === "reject" && <Spinner />} Reject submission</button>
            <button className="btn btn-ghost" onClick={() => setRejecting(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="row">
          {kyc.status !== "APPROVED" && (
            <button className="btn btn-ink" onClick={() => decide("approve")} disabled={!!busy}>{busy === "approve" ? <Spinner /> : <Check aria-hidden="true" />} Approve</button>
          )}
          {kyc.status !== "REJECTED" && (
            <button className="btn btn-danger" onClick={() => setRejecting(true)} disabled={!!busy}><X aria-hidden="true" /> Reject</button>
          )}
        </div>
      )}
    </section>
  );
}
