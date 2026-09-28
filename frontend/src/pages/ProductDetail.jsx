import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Handshake, Leaf, MapPin, Pencil, UserRound } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { rememberDeal } from "../lib/deals.js";
import { date, money, unit } from "../lib/format.js";
import { Img, Loading, Notice, Pill, Spinner } from "../components/ui.jsx";

export default function ProductDetail() {
  const { productId } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [seller, setSeller] = useState(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dealError, setDealError] = useState("");

  useEffect(() => {
    api.product(productId)
      .then((r) => {
        setP(r.data);
        api.userById(r.data.farmerId).then((u) => setSeller(u.data)).catch(() => {});
      })
      .catch((e) => setError(e.message));
  }, [productId]);

  const start = async () => {
    setBusy(true);
    setDealError("");
    try {
      const res = await api.startDeal(productId);
      const d = res.data;
      rememberDeal(user.id, {
        dealId: d._id, productId, productName: p.name, image: p.images?.[0], unit: p.unit,
        listPrice: p.price, role: "BUYER", status: d.status,
      });
      nav(`/app/deals/${d._id}`);
    } catch (e) {
      setDealError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="page"><Link to="/app/market" className="back"><ArrowLeft /> Market</Link><Notice tone="bad" title="This crop isn't available">{error}</Notice></div>;
  if (!p) return <Loading label="Loading crop" />;

  const mine = user.role === "FARMER" && String(p.farmerId) === String(user.id);
  const images = p.images?.length ? p.images : [null];

  return (
    <div className="page">
      <Link to={mine ? "/app/listings" : "/app/market"} className="back"><ArrowLeft aria-hidden="true" /> {mine ? "My crops" : "Market"}</Link>
      <div className="detail">
        <div>
          <div className="gallery-main"><Img src={images[shown]} alt={p.name} /></div>
          {images.length > 1 && (
            <div className="thumbs">
              {images.map((src, i) => (
                <button key={i} aria-current={i === shown} aria-label={`Photo ${i + 1}`} onClick={() => setShown(i)}>
                  <Img src={src} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="stack" style={{ "--gap": "1.25rem" }}>
          <div>
            <div className="row" style={{ marginBottom: "0.5rem", gap: "0.5rem" }}>
              <span className="small muted">{p.category}</span>
              {p.organic && <span className="tag"><Leaf aria-hidden="true" /> Organic</span>}
              {p.status !== "ACTIVE" && <Pill status={p.status} />}
            </div>
            <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontStretch: "115%" }}>{p.name}</h1>
          </div>

          <div className="detail-price">{money(p.price)} <span>per {unit(p.unit)}</span></div>

          <dl className="facts" style={{ margin: 0 }}>
            <div><dt>Available</dt><dd className="num">{p.quantity} {unit(p.unit)}</dd></div>
            <div><dt>Harvested</dt><dd>{date(p.harvestDate)}</dd></div>
            <div><dt>Location</dt><dd>{p.location}</dd></div>
            <div><dt>Listed</dt><dd>{date(p.createdAt)}</dd></div>
          </dl>

          {p.description && <p style={{ maxWidth: "62ch" }}>{p.description}</p>}

          {seller && !mine && (
            <div className="panel-flat row">
              <UserRound aria-hidden="true" size={20} />
              <div>
                <div style={{ fontWeight: 600 }}>{seller.fullName}</div>
                <div className="small muted row" style={{ gap: "0.25rem" }}>
                  <MapPin size={14} aria-hidden="true" /> {[seller.address?.district, seller.address?.state].filter(Boolean).join(", ")}
                </div>
              </div>
            </div>
          )}

          {dealError && <Notice tone="bad" title="Couldn't open a deal room">{dealError}</Notice>}

          {mine ? (
            <Link to={`/app/listings/${p._id}/edit`} className="btn btn-ghost"><Pencil aria-hidden="true" /> Edit listing</Link>
          ) : user.role === "BUYER" ? (
            <div className="stack" style={{ "--gap": "0.5rem" }}>
              <button className="btn btn-indigo btn-block" onClick={start} disabled={busy || p.status !== "ACTIVE"}>
                {busy ? <Spinner /> : <Handshake aria-hidden="true" />} Start negotiation
              </button>
              <p className="small faint">Opens a private deal room with the farmer. Nothing is agreed until both sides accept a final offer.</p>
            </div>
          ) : (
            <Notice tone="info">Only buyer accounts can make offers on crops.</Notice>
          )}
        </div>
      </div>
    </div>
  );
}
