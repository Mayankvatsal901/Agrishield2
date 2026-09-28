import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Handshake, Package, Plus, Store } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { Empty, Notice, ProductCard } from "../components/ui.jsx";
import { DealRow, useDeals } from "./Deals.jsx";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Home() {
  const { user, profile } = useAuth();
  const deals = useDeals();
  const [kyc, setKyc] = useState(null);
  const [mine, setMine] = useState(null);
  const [fresh, setFresh] = useState(null);
  const farmer = user.role === "FARMER";

  useEffect(() => {
    api.getKyc().then((r) => setKyc(r.data)).catch(() => {});
    if (farmer) api.myProducts().then((r) => setMine(r.data.filter((p) => !["DELETED", "DELETE"].includes(p.status)))).catch(() => setMine([]));
    else api.browse({ limit: 6, sort: "newest" }).then((r) => setFresh(r.data.products)).catch(() => setFresh([]));
  }, [farmer]);

  const open = (deals || []).filter((d) => d.status === "OPEN");
  const agreed = (deals || []).filter((d) => d.status && d.status !== "OPEN");
  const yourTurn = open.filter((d) => d.lastBy && d.lastBy !== (d.role || user.role));
  const first = profile?.fullName?.split(" ")[0];

  return (
    <div className="page stack" style={{ "--gap": "1.75rem" }}>
      <div className="greet">
        <h1>{greeting()}{first ? `, ${first}` : ""}</h1>
        <p className="muted" style={{ marginTop: "0.35rem" }}>
          {yourTurn.length
            ? `${yourTurn.length} ${yourTurn.length === 1 ? "deal is" : "deals are"} waiting for your reply.`
            : farmer ? "Here's how your crops and deals are doing." : "Here's what's new in the market."}
        </p>
      </div>

      {farmer && kyc && kyc.status !== "APPROVED" && (
        <Notice
          tone={kyc.status === "REJECTED" ? "bad" : "warn"}
          title={kyc.status === "NOT_SUBMITTED" ? "Verify your identity to start selling" : kyc.status === "PENDING" ? "Your documents are being reviewed" : "Verification needs another try"}
          action={kyc.status !== "PENDING" && <Link to="/app/kyc" className="btn btn-sm btn-ink">{kyc.status === "NOT_SUBMITTED" ? "Upload documents" : "Fix and resubmit"}</Link>}
        >
          {kyc.status === "NOT_SUBMITTED" ? "Upload your Aadhaar and PAN. It takes about two minutes."
            : kyc.status === "PENDING" ? "You can list crops as soon as it's approved."
            : kyc.rejectionReason || "Upload clearer photos of your documents."}
        </Notice>
      )}

      <div className="tally">
        {farmer ? (
          <div><b>{mine ? mine.filter((p) => p.status === "ACTIVE").length : "–"}</b><span>Crops in market</span></div>
        ) : (
          <div><b>{deals ? deals.length : "–"}</b><span>Deals started</span></div>
        )}
        <div><b>{deals ? open.length : "–"}</b><span>Negotiating</span></div>
        <div><b>{deals ? agreed.length : "–"}</b><span>Agreed</span></div>
      </div>

      <div className="home-grid">
        <section>
          <div className="section-head">
            <h2 style={{ fontSize: "var(--step-1)" }}>Recent deals</h2>
            <Link to="/app/deals">All deals</Link>
          </div>
          {deals && deals.length === 0 ? (
            <Empty icon={Handshake} title="No deals yet"
              action={!farmer && <Link to="/app/market" className="btn btn-indigo"><Store aria-hidden="true" /> Browse the market</Link>}>
              {farmer ? "When buyers start negotiating on your crops, the deal rooms appear here." : "Pick a crop and start a negotiation with the farmer."}
            </Empty>
          ) : (
            <div className="list">{(deals || []).slice(0, 5).map((d) => <DealRow key={d.dealId} d={d} myRole={user.role} />)}</div>
          )}
        </section>

        <section>
          <div className="section-head">
            <h2 style={{ fontSize: "var(--step-1)" }}>{farmer ? "Your crops" : "Just listed"}</h2>
            <Link to={farmer ? "/app/listings" : "/app/market"}>{farmer ? "Manage" : "See all"}</Link>
          </div>
          {farmer ? (
            mine && mine.length === 0 ? (
              <Empty icon={Package} title="Nothing listed yet"
                action={kyc?.status === "APPROVED" && <Link to="/app/listings/new" className="btn btn-primary"><Plus aria-hidden="true" /> List a crop</Link>}>
                {kyc?.status === "APPROVED" ? "Add your first crop so buyers can find it." : "You can list crops once verification is approved."}
              </Empty>
            ) : (
              <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {(mine || []).slice(0, 4).map((p) => <ProductCard key={p._id} p={p} />)}
              </div>
            )
          ) : (
            <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {(fresh || []).slice(0, 4).map((p) => <ProductCard key={p._id} p={p} />)}
              {fresh && fresh.length === 0 && <p className="muted">No crops listed yet.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
