import { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, ImageOff, Info, Leaf, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { money, unit } from "../lib/format.js";

/* ---------- Status pill ---------- */
const TONES = {
  APPROVED: "ok", ACTIVE: "ok", ACCEPTED: "ok", COMPLETED: "ok", CONTRACT_GENERATED: "ok",
  PENDING: "warn", OPEN: "info", NEGOTIATING: "info", FINAL_OFFER: "warn", CONTRACT_PENDING: "warn",
  UNDER_NEGOTIATION: "info", RESERVED: "warn", PROCESSING: "warn",
  REJECTED: "bad", CANCELLED: "bad", FAILED: "bad", DELETED: "bad", DELETE: "bad",
};
const LABELS = {
  OPEN: "Negotiating", CONTRACT_PENDING: "Contract in progress", CONTRACT_GENERATED: "Contract ready",
  NOT_SUBMITTED: "Not submitted", UNDER_NEGOTIATION: "In negotiation", PENDING: "In review",
  FINAL_OFFER: "Final offer",
};
export function Pill({ status, children }) {
  const label = children || LABELS[status] || (status ? status[0] + status.slice(1).toLowerCase().replace(/_/g, " ") : "");
  return <span className={`pill ${TONES[status] || ""}`}>{label}</span>;
}

/* ---------- Notice ---------- */
export function Notice({ tone = "info", title, children, action }) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div className={`notice ${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <Icon aria-hidden="true" />
      <div className="grow">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Empty & loading ---------- */
export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="empty">
      {Icon && <Icon aria-hidden="true" />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function Loading({ label = "Loading" }) {
  return (
    <div className="loading" role="status">
      <div className="spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}
export const Spinner = () => <span className="spinner" aria-hidden="true" style={{ width: 16, height: 16 }} />;

/* ---------- Field ---------- */
export function Field({ label, hint, error, children, className = "", htmlFor }) {
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  );
}

/* ---------- Image with fallback ---------- */
export function Img({ src, alt = "" }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <div className="img-fallback" aria-hidden={!alt}>
        <ImageOff />
      </div>
    );
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} />;
}

/* ---------- Product card ---------- */
export function ProductCard({ p, to }) {
  return (
    <Link to={to || `/app/market/${p._id}`} className="pcard">
      <div className="pcard-img">
        <Img src={p.images?.[0]} alt="" />
        {p.organic && (
          <span className="tag">
            <Leaf aria-hidden="true" /> Organic
          </span>
        )}
      </div>
      <div className="pcard-body">
        <div className="pcard-title">{p.name}</div>
        {p.location && (
          <div className="pcard-meta">
            <MapPin aria-hidden="true" /> {p.location}
          </div>
        )}
        <div className="pcard-foot">
          <div className="pcard-price">
            {money(p.price)} <span>/ {unit(p.unit)}</span>
          </div>
          <div className="pcard-qty">{p.quantity} {unit(p.unit)} left</div>
        </div>
      </div>
    </Link>
  );
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((msg, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, msg, tone }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>
            {t.tone === "bad" ? <AlertCircle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
