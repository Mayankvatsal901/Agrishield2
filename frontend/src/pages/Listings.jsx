import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api.js";
import { date, money, unit } from "../lib/format.js";
import { Empty, Img, Loading, Notice, Pill, Spinner, useToast } from "../components/ui.jsx";
import { useEligibility } from "./useEligibility.js";

export default function Listings() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const elig = useEligibility();

  const load = () =>
    api.myProducts()
      .then((r) => setItems(r.data.filter((p) => !["DELETED", "DELETE"].includes(p.status))))
      .catch((e) => { setError(e.message); setItems([]); });
  useEffect(() => { load(); }, []);

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteProduct(confirm._id);
      toast(`${confirm.name} removed from the market`);
      setConfirm(null);
      load();
    } catch (e) {
      toast(e.message, "bad");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My crops</h1>
          <p>Everything you've listed. Buyers see active listings in the market.</p>
        </div>
        {elig?.canSell && <Link to="/app/listings/new" className="btn btn-primary"><Plus aria-hidden="true" /> List a crop</Link>}
      </div>

      {elig && !elig.canSell && (
        <div style={{ marginBottom: "1.25rem" }}>
          <Notice tone="warn" title="Finish verification to list crops" action={<Link to="/app/kyc" className="btn btn-sm btn-ink">Go to verification</Link>}>
            {elig.reason}
          </Notice>
        </div>
      )}
      {error && <Notice tone="bad">{error}</Notice>}

      {!items ? <Loading label="Loading your crops" /> : items.length === 0 ? (
        <Empty icon={Package} title="You haven't listed anything yet"
          action={elig?.canSell && <Link to="/app/listings/new" className="btn btn-primary"><Plus aria-hidden="true" /> List your first crop</Link>}>
          Add a crop with a few photos, the quantity you have, and your asking price.
        </Empty>
      ) : (
        <div className="list">
          {items.map((p) => (
            <div className="list-row" key={p._id}>
              <Link to={`/app/market/${p._id}`} className="list-thumb"><Img src={p.images?.[0]} alt="" /></Link>
              <div style={{ minWidth: 0 }}>
                <Link to={`/app/market/${p._id}`} className="list-title" style={{ color: "inherit", textDecoration: "none" }}>{p.name}</Link>
                <div className="list-sub num">
                  {money(p.price)} / {unit(p.unit)}, {p.quantity} {unit(p.unit)} listed {date(p.createdAt)}
                </div>
              </div>
              <div className="row" style={{ gap: "0.5rem" }}>
                <Pill status={p.status} />
                <Link to={`/app/listings/${p._id}/edit`} className="icon-btn" aria-label={`Edit ${p.name}`}><Pencil /></Link>
                <button className="icon-btn" aria-label={`Remove ${p.name}`} onClick={() => setConfirm(p)}><Trash2 /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirm && (
        <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="rm-title" onClick={() => !busy && setConfirm(null)}>
          <div className="modal stack" onClick={(e) => e.stopPropagation()}>
            <h2 id="rm-title">Remove {confirm.name}?</h2>
            <p className="muted">It will disappear from the market. Deals already in progress aren't affected.</p>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={busy}>Keep listing</button>
              <button className="btn btn-danger" onClick={remove} disabled={busy}>{busy && <Spinner />} Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
