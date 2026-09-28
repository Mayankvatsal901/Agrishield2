import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Wheat } from "lucide-react";
import { api } from "../lib/api.js";
import { CATEGORIES } from "../config.js";
import { Empty, Field, Notice, ProductCard } from "../components/ui.jsx";

const LIMIT = 12;

export default function Market() {
  const [params, setParams] = useSearchParams();
  const q = Object.fromEntries(params);
  const page = Number(q.page) || 1;

  const [search, setSearch] = useState(q.search || "");
  const [location, setLocation] = useState(q.location || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const update = (patch) => {
    const next = { ...q, ...patch };
    if (!("page" in patch)) delete next.page;
    Object.keys(next).forEach((k) => (next[k] === "" || next[k] === undefined) && delete next[k]);
    setParams(next, { replace: true });
  };

  // debounce the free-text inputs
  useEffect(() => {
    const t = setTimeout(() => {
      if ((q.search || "") !== search || (q.location || "") !== location) update({ search, location });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, location]);

  useEffect(() => {
    let live = true;
    setError("");
    setData(null);
    api
      .browse({ ...q, page, limit: LIMIT })
      .then((r) => live && setData(r.data))
      .catch((e) => live && (setError(e.message), setData({ products: [], pagination: {} })));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const products = data?.products || [];
  const pg = data?.pagination || {};
  const filtered = q.search || q.category || q.location || q.organic;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Market</h1>
          <p>Crops listed by verified farmers. Open one to see details and start a negotiation.</p>
        </div>
      </div>

      <div className="filters">
        <Field label="Search crops" htmlFor="q" className="search">
          <div className="input-affix">
            <span><Search size={16} aria-hidden="true" /></span>
            <input id="q" className="input" placeholder="Wheat, onion, basmati…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </Field>
        <Field label="Location" htmlFor="loc">
          <input id="loc" className="input" placeholder="District or state" value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <Field label="Sort by" htmlFor="sort">
          <select id="sort" className="select" value={q.sort || "newest"} onChange={(e) => update({ sort: e.target.value })}>
            <option value="newest">Newest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
            <option value="oldest">Oldest first</option>
          </select>
        </Field>
        <div className="field">
          <span className="label">Farming</span>
          <div className="segmented" role="group" aria-label="Farming method">
            <button type="button" aria-pressed={!q.organic} onClick={() => update({ organic: "" })}>All</button>
            <button type="button" aria-pressed={q.organic === "true"} onClick={() => update({ organic: "true" })}>Organic</button>
          </div>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Category">
        <button className="chip" aria-pressed={!q.category} onClick={() => update({ category: "" })}>All crops</button>
        {CATEGORIES.map((c) => (
          <button key={c} className="chip" aria-pressed={q.category === c} onClick={() => update({ category: q.category === c ? "" : c })}>{c}</button>
        ))}
      </div>

      {error && <div style={{ marginBottom: "1rem" }}><Notice tone="bad" title="Couldn't load the market">{error}</Notice></div>}

      {!data ? (
        <div className="grid-cards">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: "4/4.2" }} />)}
        </div>
      ) : products.length === 0 && !error ? (
        <Empty
          icon={Wheat}
          title={filtered ? "No crops match these filters" : "No crops listed yet"}
          action={filtered && <button className="btn btn-ghost" onClick={() => { setSearch(""); setLocation(""); setParams({}); }}>Clear filters</button>}
        >
          {filtered ? "Try a different crop name, a wider location, or another category." : "Listings from verified farmers will appear here."}
        </Empty>
      ) : (
        <>
          <p className="small faint" style={{ marginBottom: "0.75rem" }}>
            {pg.totalProducts} {pg.totalProducts === 1 ? "listing" : "listings"}
          </p>
          <div className="grid-cards">{products.map((p) => <ProductCard key={p._id} p={p} />)}</div>
          {pg.totalPages > 1 && (
            <nav className="pager" aria-label="Pages">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Previous</button>
              <span className="small muted num">Page {page} of {pg.totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= pg.totalPages} onClick={() => update({ page: page + 1 })}>Next</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
