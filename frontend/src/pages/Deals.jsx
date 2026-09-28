import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Handshake, Store } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { listDeals, rememberDeal } from "../lib/deals.js";
import { ago, money, shortId, unit } from "../lib/format.js";
import { Empty, Field, Img, Loading, Pill } from "../components/ui.jsx";

/** Loads deals from GET /api/deals/my when the backend has it, else from this browser's index. */
export function useDeals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      let list = listDeals(user.id);
      try {
        const r = await api.myDeals();
        const server = Array.isArray(r.data) ? r.data : r.data?.deals || [];
        server.forEach((d) =>
          rememberDeal(user.id, {
            dealId: d._id, productId: d.productId, status: d.status,
            role: String(d.buyerId) === String(user.id) ? "BUYER" : "FARMER",
          })
        );
        list = listDeals(user.id);
      } catch { /* endpoint not added yet: fall back to local index */ }

      // Refresh each deal's status and fill in missing product info.
      const fresh = await Promise.all(
        list.slice(0, 30).map(async (d) => {
          const next = { ...d };
          try {
            const o = await api.offers(d.dealId);
            const last = o.data.offers[o.data.offers.length - 1];
            next.status = o.data.dealStatus;
            if (last) { next.lastPrice = last.pricePerUnit; next.unit = last.unit; next.lastAt = last.createdAt; next.lastBy = last.offeredByRole; }
          } catch { /* keep cached */ }
          if (d.productId && !d.productName) {
            try {
              const p = await api.product(d.productId);
              Object.assign(next, { productName: p.data.name, image: p.data.images?.[0], unit: next.unit || p.data.unit, listPrice: p.data.price });
            } catch { /* product removed */ }
          }
          return next;
        })
      );
      fresh.forEach((d) => rememberDeal(user.id, d));
      if (live) setDeals(fresh);
    })();
    return () => { live = false; };
  }, [user.id]);

  return deals;
}

export function DealRow({ d, myRole }) {
  const waiting = d.status === "OPEN" && d.lastBy && d.lastBy !== (d.role || myRole);
  return (
    <Link to={`/app/deals/${d.dealId}`} className="list-row">
      <div className="list-thumb"><Img src={d.image} alt="" /></div>
      <div style={{ minWidth: 0 }}>
        <div className="list-title">{d.productName || `Deal ${shortId(d.dealId)}`}</div>
        <div className="list-sub num">
          {d.lastPrice ? `Latest offer ${money(d.lastPrice)} / ${unit(d.unit)}` : "No offers yet"}
          {d.otherName ? `, with ${d.otherName}` : ""}
          {d.lastAt ? `, ${ago(d.lastAt)}` : ""}
        </div>
      </div>
      <div className="row" style={{ gap: "0.4rem" }}>
        {waiting && <span className="pill warn">Your turn</span>}
        <Pill status={d.status} />
      </div>
    </Link>
  );
}

function parseDealId(s) {
  const m = String(s).match(/[a-f0-9]{24}/i);
  return m ? m[0] : "";
}

export default function Deals() {
  const { user } = useAuth();
  const deals = useDeals();
  const nav = useNavigate();
  const [link, setLink] = useState("");
  const [filter, setFilter] = useState("active");

  if (!deals) return <Loading label="Loading your deals" />;
  const active = deals.filter((d) => d.status === "OPEN" || !d.status);
  const done = deals.filter((d) => d.status && d.status !== "OPEN");
  const shown = filter === "active" ? active : done;
  const id = parseDealId(link);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Deals</h1>
          <p>Each deal is a private room with one {user.role === "FARMER" ? "buyer" : "farmer"}: offers on one side, chat on the other.</p>
        </div>
        <div className="segmented" role="group" aria-label="Show">
          <button aria-pressed={filter === "active"} onClick={() => setFilter("active")}>Negotiating ({active.length})</button>
          <button aria-pressed={filter === "done"} onClick={() => setFilter("done")}>Agreed ({done.length})</button>
        </div>
      </div>

      {shown.length === 0 ? (
        <Empty
          icon={Handshake}
          title={filter === "active" ? "No open negotiations" : "No agreed deals yet"}
          action={user.role === "BUYER" && filter === "active" && <Link to="/app/market" className="btn btn-indigo"><Store aria-hidden="true" /> Browse the market</Link>}
        >
          {user.role === "BUYER"
            ? "Open a crop in the market and choose Start negotiation."
            : "When a buyer starts a negotiation, they can send you the deal room link. Paste it below to join."}
        </Empty>
      ) : (
        <div className="list">{shown.map((d) => <DealRow key={d.dealId} d={d} myRole={user.role} />)}</div>
      )}

      <form className="panel-flat row" style={{ marginTop: "1.5rem", alignItems: "flex-end" }}
        onSubmit={(e) => { e.preventDefault(); if (id) nav(`/app/deals/${id}`); }}>
        <Field label="Open a deal room from a link" htmlFor="deal-link" className="grow" hint="Paste the link the other side shared with you">
          <input id="deal-link" className="input" placeholder="https://…/app/deals/…" value={link} onChange={(e) => setLink(e.target.value)} />
        </Field>
        <button className="btn btn-ink" disabled={!id}>Open</button>
      </form>
    </div>
  );
}
