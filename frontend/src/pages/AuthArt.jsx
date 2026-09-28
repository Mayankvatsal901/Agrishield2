import Brand from "../components/Brand.jsx";

/* Left panel on sign-in, register and forgot-password pages. */
export default function AuthArt({ quote = "Every rupee agreed, on the record." }) {
  const xs = [-700, -440, -180, 80, 340, 600, 860, 1120];
  return (
    <aside className="auth-art" aria-hidden="true">
      <svg className="furrows" viewBox="0 0 720 380" preserveAspectRatio="none">
        {xs.map((x, i) => (
          <line key={x} x1={x} y1="380" x2="460" y2="0"
            stroke={i % 3 === 1 ? "rgba(235,169,46,0.14)" : "rgba(242,237,225,0.05)"} strokeWidth="1.2" />
        ))}
      </svg>
      <Brand />
      <div style={{ display: "grid", gap: "1.75rem" }}>
        <blockquote>{quote}</blockquote>
        <div className="auth-deal">
          <div className="auth-deal-top"><span>Yellow mustard, 12 quintal</span><b>Agreed</b></div>
          <div className="auth-deal-track">
            <i style={{ left: "24%", background: "rgba(134,169,224,0.45)" }} />
            <i style={{ left: "40%", background: "rgba(134,169,224,0.45)" }} />
            <i style={{ left: "70%", background: "rgba(235,169,46,0.5)" }} />
            <i style={{ left: "84%", background: "rgba(235,169,46,0.5)" }} />
            <span className="agreed" style={{ left: "58%" }} />
          </div>
          <div className="auth-deal-bottom"><span>After 5 offers</span><b>₹5,550 <span>/ quintal</span></b></div>
        </div>
      </div>
    </aside>
  );
}