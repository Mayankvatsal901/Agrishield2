import { Check, Handshake, MoveHorizontal } from "lucide-react";
import { money, unit as unitLabel } from "../lib/format.js";

/**
 * The price ribbon: the buyer's latest price and the farmer's latest price
 * on one track, and how far apart they are. Buyer = slate blue, farmer = turmeric.
 */
export default function Ribbon({
  buyer, farmer, agreed, unit, history = [], size, buyerLabel = "Buyer offers", farmerLabel = "Farmer asks",
}) {
  const values = [buyer, farmer, agreed, ...history.map((h) => h.price)].filter((v) => typeof v === "number" && v > 0);
  if (!values.length) return null;

  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const span = hi - lo || hi * 0.2 || 1;
  lo = Math.max(0, lo - span * 0.25);
  hi = hi + span * 0.25;
  const pos = (v) => `${((v - lo) / (hi - lo)) * 100}%`;

  const both = buyer > 0 && farmer > 0;
  const gap = both ? farmer - buyer : null;
  const pct = both && farmer ? Math.abs(gap / farmer) * 100 : null;
  const u = unitLabel(unit);

  return (
    <div className={`ribbon ${size === "hero" ? "hero-size" : ""}`}>
      <div className="ribbon-legend">
        <div className="ribbon-side">
          <span className="ribbon-who"><i style={{ background: "var(--buyer)" }} /> {buyerLabel}</span>
          <span className="ribbon-price" style={{ color: "var(--buyer)" }}>{buyer ? money(buyer) : "—"}</span>
        </div>
        <div className="ribbon-side right">
          <span className="ribbon-who"><i style={{ background: "var(--farmer)" }} /> {farmerLabel}</span>
          <span className="ribbon-price" style={{ color: "var(--farmer)" }}>{farmer ? money(farmer) : "—"}</span>
        </div>
      </div>

      <div
        className="ribbon-track"
        role="img"
        aria-label={
          agreed
            ? `Agreed at ${money(agreed)} per ${u}`
            : both
              ? `Buyer at ${money(buyer)}, farmer at ${money(farmer)} per ${u}, ${money(Math.abs(gap))} apart`
              : "Waiting for both sides to make an offer"
        }
      >
        {history.map((h, i) => (
          <span key={i} className={`ribbon-ghost ${h.side}`} style={{ left: pos(h.price) }} />
        ))}
        {both && !agreed && gap !== 0 && (
          <span className="ribbon-gap" style={{ left: pos(Math.min(buyer, farmer)), width: `calc(${pos(Math.max(buyer, farmer))} - ${pos(Math.min(buyer, farmer))})` }} />
        )}
        {agreed ? (
          <>
            <span className="ribbon-mark agreed" style={{ left: pos(agreed) }} />
            <span className="ribbon-stamp" aria-hidden="true" style={{ left: `clamp(18%, ${pos(agreed)}, 82%)` }}>
              Agreed {money(agreed)}
            </span>
          </>
        ) : (
          <>
            {buyer > 0 && <span className="ribbon-mark buyer" style={{ left: pos(buyer) }} />}
            {farmer > 0 && <span className="ribbon-mark farmer" style={{ left: pos(farmer) }} />}
          </>
        )}
      </div>
      <div className="ribbon-scale" aria-hidden="true">
        <span>{money(Math.round(lo))}</span>
        <span>per {u}</span>
        <span>{money(Math.round(hi))}</span>
      </div>

      <div className="ribbon-verdict">
        {agreed ? (
          <><Check style={{ color: "var(--ok)" }} aria-hidden="true" /> Agreed at {money(agreed)} / {u}</>
        ) : both && gap <= 0 ? (
          <><Handshake style={{ color: "var(--ok)" }} aria-hidden="true" /> Prices meet. Either side can send a final offer.</>
        ) : both ? (
          <><MoveHorizontal aria-hidden="true" /> {money(gap)} apart per {u} <span className="faint">({pct.toFixed(1)}%)</span></>
        ) : (
          <span className="muted">The ribbon fills in as both sides make offers.</span>
        )}
      </div>
    </div>
  );
}