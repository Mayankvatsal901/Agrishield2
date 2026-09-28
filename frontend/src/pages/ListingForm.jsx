import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { CATEGORIES, UNITS, UNIT_LABEL } from "../config.js";
import { money } from "../lib/format.js";
import { Field, Loading, Notice, Spinner, useToast } from "../components/ui.jsx";
import ImagePicker from "../components/ImagePicker.jsx";

const today = () => new Date().toISOString().slice(0, 10);

export default function ListingForm() {
  const { productId } = useParams();
  const editing = Boolean(productId);
  const { profile } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [v, setV] = useState({
    name: "", category: "", description: "", price: "", quantity: "", unit: "QUINTAL",
    location: profile ? [profile.address?.district, profile.address?.state].filter(Boolean).join(", ") : "",
    harvestDate: today(), organic: false,
  });
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [loaded, setLoaded] = useState(!editing);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.product(productId).then((r) => {
      const p = r.data;
      setV({
        name: p.name, category: p.category, description: p.description, price: String(p.price),
        quantity: String(p.quantity), unit: p.unit, location: p.location,
        harvestDate: p.harvestDate ? p.harvestDate.slice(0, 10) : today(), organic: Boolean(p.organic),
      });
      setExisting(p.images || []);
      setLoaded(true);
    }).catch((e) => { setError(e.message); setLoaded(true); });
  }, [editing, productId]);

  const set = (k) => (e) => setV({ ...v, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const check = () => {
    const e = {};
    if (!v.name.trim()) e.name = "Give the crop a name buyers will search for";
    if (!v.category) e.category = "Choose a category";
    if (!v.description.trim()) e.description = "Describe quality, variety or storage";
    if (!(Number(v.price) > 0)) e.price = "Enter a price above zero";
    if (!(Number(v.quantity) >= 1)) e.quantity = "Enter at least 1";
    if (!v.location.trim()) e.location = "Where can the buyer collect it?";
    if (!v.harvestDate) e.harvestDate = "Pick the harvest date";
    if (!editing && files.length === 0) e.images = "Add at least one photo";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!check()) return;
    setBusy(true);
    setError("");
    const form = new FormData();
    Object.entries(v).forEach(([k, val]) => form.append(k, String(val)));
    files.forEach((f) => form.append("images", f));
    try {
      if (editing) await api.updateProduct(productId, form);
      else await api.createProduct(form);
      toast(editing ? "Listing updated" : `${v.name} is now in the market`);
      nav("/app/listings");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <Loading label="Loading listing" />;
  const total = Number(v.price) * Number(v.quantity);

  return (
    <div className="page page-narrow">
      <Link to="/app/listings" className="back"><ArrowLeft aria-hidden="true" /> My crops</Link>
      <div className="page-head">
        <div>
          <h1>{editing ? "Edit listing" : "List a crop"}</h1>
          <p>{editing ? "Changes show in the market right away." : "Buyers will see this in the market once you publish it."}</p>
        </div>
      </div>

      <form onSubmit={submit} className="stack" style={{ "--gap": "1.25rem" }} noValidate>
        {error && <Notice tone="bad" title={editing ? "Couldn't save changes" : "Couldn't publish this crop"}>{error}</Notice>}

        <section className="panel stack">
          <h2 style={{ fontSize: "var(--step-1)" }}>Photos</h2>
          <ImagePicker files={files} onChange={setFiles} existing={existing} />
          {errors.images ? <span className="err small" style={{ color: "var(--chili)" }}>{errors.images}</span>
            : <span className="small faint">Up to 5 photos. {editing && existing.length ? "New photos replace the current ones." : "Daylight photos of the actual produce work best."}</span>}
        </section>

        <section className="panel form-grid">
          <Field label="Crop name" htmlFor="name" error={errors.name} className="span-2" hint="Include the variety, e.g. Sharbati wheat or Nashik red onion">
            <input id="name" className="input" value={v.name} onChange={set("name")} />
          </Field>
          <Field label="Category" htmlFor="category" error={errors.category}>
            <select id="category" className="select" value={v.category} onChange={set("category")}>
              <option value="">Choose one</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Harvest date" htmlFor="harvestDate" error={errors.harvestDate}>
            <input id="harvestDate" type="date" className="input" value={v.harvestDate} onChange={set("harvestDate")} />
          </Field>
          <Field label="Description" htmlFor="description" error={errors.description} className="span-2">
            <textarea id="description" className="textarea" value={v.description} onChange={set("description")}
              placeholder="Grain size, moisture, how it's stored, packing…" />
          </Field>
          <label className="check span-2">
            <input type="checkbox" checked={v.organic} onChange={set("organic")} /> Grown organically
          </label>
        </section>

        <section className="panel form-grid">
          <Field label="Selling unit" htmlFor="unit">
            <select id="unit" className="select" value={v.unit} onChange={set("unit")}>
              {UNITS.map((u) => <option key={u} value={u}>{UNIT_LABEL[u]}</option>)}
            </select>
          </Field>
          <Field label={`Quantity available (${UNIT_LABEL[v.unit]})`} htmlFor="quantity" error={errors.quantity}>
            <input id="quantity" type="number" min="1" inputMode="decimal" className="input num" value={v.quantity} onChange={set("quantity")} />
          </Field>
          <Field label={`Asking price per ${UNIT_LABEL[v.unit]}`} htmlFor="price" error={errors.price} hint="Buyers can negotiate from here">
            <div className="input-affix"><span>₹</span>
              <input id="price" type="number" min="0" step="0.01" inputMode="decimal" className="input num" value={v.price} onChange={set("price")} />
            </div>
          </Field>
          <Field label="Pickup location" htmlFor="location" error={errors.location}>
            <input id="location" className="input" value={v.location} onChange={set("location")} />
          </Field>
          {total > 0 && (
            <div className="span-2 composer-total">
              <span className="muted">Value at asking price</span>
              <b>{money(total)}</b>
            </div>
          )}
        </section>

        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Link to="/app/listings" className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={busy}>{busy && <Spinner />} {editing ? "Save changes" : "Publish listing"}</button>
        </div>
      </form>
    </div>
  );
}
