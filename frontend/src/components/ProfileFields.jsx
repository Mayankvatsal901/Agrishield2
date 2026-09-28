import { BUSINESS_TYPES, LANGUAGES, STATES } from "../config.js";
import { Field } from "./ui.jsx";

export const emptyProfile = {
  fullName: "", phone: "", language: "hi",
  address: { state: "", district: "", village: "", pincode: "" },
  companyName: "", businessType: "", gstNumber: "", licenseNumber: "",
};

export function fromServer(profile, buyerProfile) {
  if (!profile) return emptyProfile;
  return {
    fullName: profile.fullName || "",
    phone: profile.phone || "",
    language: profile.language || "en",
    address: { ...emptyProfile.address, ...(profile.address || {}) },
    companyName: buyerProfile?.companyName || "",
    businessType: buyerProfile?.businessType || "",
    gstNumber: buyerProfile?.gstNumber || "",
    licenseNumber: buyerProfile?.licenseNumber || "",
  };
}

export function validate(section, v, role) {
  const e = {};
  if (section === "you" || section === "all") {
    if (!v.fullName || v.fullName.trim().length < 3) e.fullName = "Enter your full name (at least 3 letters)";
    if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = "Enter a 10-digit mobile number starting with 6–9";
  }
  if (section === "place" || section === "all") {
    if (!v.address.state) e.state = "Choose your state";
    if (!v.address.district.trim()) e.district = "Enter your district";
    if (!/^\d{6}$/.test(v.address.pincode)) e.pincode = "Enter a 6-digit pincode";
  }
  if ((section === "business" || section === "all") && role === "BUYER") {
    if (!v.businessType) e.businessType = "Choose your type of business";
  }
  return e;
}

export default function ProfileFields({ section, value: v, onChange, errors = {}, role }) {
  const set = (patch) => onChange({ ...v, ...patch });
  const setAddr = (patch) => onChange({ ...v, address: { ...v.address, ...patch } });

  return (
    <div className="stack">
      {(section === "you" || section === "all") && (
        <div className="form-grid">
          <Field label="Full name" htmlFor="fullName" error={errors.fullName} className="span-2">
            <input id="fullName" className="input" autoComplete="name" value={v.fullName}
              onChange={(e) => set({ fullName: e.target.value })} />
          </Field>
          <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="Buyers and farmers see this after you start a deal">
            <div className="input-affix">
              <span>+91</span>
              <input id="phone" className="input" inputMode="numeric" autoComplete="tel-national" maxLength={10}
                style={{ paddingLeft: "3rem" }} value={v.phone}
                onChange={(e) => set({ phone: e.target.value.replace(/\D/g, "") })} />
            </div>
          </Field>
        </div>
      )}

      {(section === "language" || section === "all") && (
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="label" style={{ marginBottom: "0.35rem" }}>Language for chat</legend>
          <p className="small faint" style={{ marginBottom: "0.75rem" }}>
            Messages from the other side are translated into this language.
          </p>
          <div className="lang-grid">
            {LANGUAGES.map((l) => (
              <button type="button" key={l.code} className="lang" aria-pressed={v.language === l.code}
                onClick={() => set({ language: l.code })} lang={l.code}>
                <b>{l.native}</b>
                <small>{l.name}</small>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {(section === "place" || section === "all") && (
        <div className="form-grid">
          <Field label="State" htmlFor="state" error={errors.state}>
            <select id="state" className="select" value={v.address.state} onChange={(e) => setAddr({ state: e.target.value })}>
              <option value="">Choose state</option>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="District" htmlFor="district" error={errors.district}>
            <input id="district" className="input" value={v.address.district} onChange={(e) => setAddr({ district: e.target.value })} />
          </Field>
          <Field label="Village or town" htmlFor="village" hint="Optional">
            <input id="village" className="input" value={v.address.village} onChange={(e) => setAddr({ village: e.target.value })} />
          </Field>
          <Field label="Pincode" htmlFor="pincode" error={errors.pincode}>
            <input id="pincode" className="input" inputMode="numeric" maxLength={6} autoComplete="postal-code"
              value={v.address.pincode} onChange={(e) => setAddr({ pincode: e.target.value.replace(/\D/g, "") })} />
          </Field>
        </div>
      )}

      {(section === "business" || section === "all") && role === "BUYER" && (
        <div className="form-grid">
          <Field label="Type of business" htmlFor="businessType" error={errors.businessType}>
            <select id="businessType" className="select" value={v.businessType} onChange={(e) => set({ businessType: e.target.value })}>
              <option value="">Choose one</option>
              {BUSINESS_TYPES.map((b) => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Company name" htmlFor="companyName" hint="Optional">
            <input id="companyName" className="input" value={v.companyName} onChange={(e) => set({ companyName: e.target.value })} />
          </Field>
          <Field label="GST number" htmlFor="gst" hint="Optional">
            <input id="gst" className="input" value={v.gstNumber} maxLength={15}
              onChange={(e) => set({ gstNumber: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Trade licence number" htmlFor="lic" hint="Optional">
            <input id="lic" className="input" value={v.licenseNumber} onChange={(e) => set({ licenseNumber: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  );
}
