import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Check, Play, RotateCcw, ShieldCheck, Store, Wheat } from "lucide-react";
import Brand from "../components/Brand.jsx";
import Ribbon from "../components/Ribbon.jsx";
import { useAuth } from "../lib/auth.jsx";

// A wheat negotiation, replayed once on load.
const SCRIPT = [
  { buyer: 0, farmer: 2450 },
  { buyer: 1900, farmer: 2450 },
  { buyer: 1900, farmer: 2300 },
  { buyer: 2050, farmer: 2300 },
  { buyer: 2050, farmer: 2180 },
  { buyer: 2150, farmer: 2180 },
  { buyer: 2150, farmer: 2180, agreed: 2160 },
];

function useScript() {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [i, setI] = useState(reduce ? SCRIPT.length - 1 : 0);
  useEffect(() => {
    if (reduce || i >= SCRIPT.length - 1) return;
    const t = setTimeout(() => setI(i + 1), i === 0 ? 900 : 1150);
    return () => clearTimeout(t);
  }, [i, reduce]);
  const history = SCRIPT.slice(0, i).flatMap((s) => [
    s.buyer && { side: "buyer", price: s.buyer },
    s.farmer && { side: "farmer", price: s.farmer },
  ]).filter(Boolean);
  return { step: SCRIPT[i], history, replay: () => setI(0), done: i === SCRIPT.length - 1 };
}

/* Crop rows running to the horizon, drawn behind the hero. */
function Rows() {
  const xs = [-700, -460, -220, 20, 260, 500, 740, 980, 1220, 1460, 1700, 1940];
  return (
    <svg className="lp-rows" viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden="true">
      {xs.map((x, i) => (
        <line key={x} x1={x} y1="420" x2="980" y2="0"
          stroke={i % 3 === 1 ? "rgba(235,169,46,0.14)" : "rgba(242,237,225,0.05)"} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

const WAVE = [8, 16, 24, 12, 20, 8, 16, 26, 14, 6, 18, 10, 22, 12, 6, 16, 10, 20, 8, 14];
const LANGS = ["हिन्दी", "मराठी", "ਪੰਜਾਬੀ", "ગુજરાતી", "தமிழ்", "తెలుగు", "বাংলা", "English"];

export default function Landing() {
  const { user } = useAuth();
  const { step, history, replay, done } = useScript();
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="lp">
      <Rows />
      <header className="public-head">
        <Brand />
        <nav>
          <a href="#how" className="nav-link">How it works</a>
          <Link to="/verify" className="nav-link">Check a contract</Link>
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Create account</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="lp-hero">
        <div>
          <h1>Sell your harvest at a price you both agree on.</h1>
          <p className="lp-lede">
            Farmers list crops, buyers make offers, and both sides chat in their own language.
            Shake hands, and you get a contract anyone can check.
          </p>
          <div className="lp-cta">
            <Link to="/register?role=FARMER" className="btn btn-primary"><Wheat aria-hidden="true" /> I grow crops</Link>
            <Link to="/register?role=BUYER" className="btn btn-indigo"><Store aria-hidden="true" /> I buy crops</Link>
          </div>
          <p className="lp-langs">Works in Hindi, Marathi, Tamil, Bengali and nine more languages.</p>
        </div>

        <div className="deal-card">
          <div className="deal-card-head">
            <div className="deal-card-crop">
              <span className="deal-card-icon"><Wheat aria-hidden="true" /></span>
              <div>
                <div className="deal-card-title">Sharbati wheat, 40 quintal</div>
                <div className="deal-card-sub">Sehore, Madhya Pradesh</div>
              </div>
            </div>
            {done && (
              <button className="btn btn-ghost btn-sm" onClick={replay}>
                <RotateCcw aria-hidden="true" /> Replay
              </button>
            )}
          </div>
          <Ribbon size="hero" unit="QUINTAL" buyer={step.buyer} farmer={step.farmer} agreed={step.agreed} history={history} />
        </div>
      </section>

      {/* language */}
      <div className="lp-band">
        <section className="lp-section lp-split">
          <div className="chat-demo" aria-label="Example chat">
            <div className="chat-demo-head">
              <b>Chat with Ramesh</b>
              <span>You read English, he reads Hindi</span>
            </div>
            <div className="bubble mine from-buyer" style={{ alignSelf: "flex-end" }}>
              Is the moisture under 12%? We need it for flour milling.
              <div className="meta">9:10 am</div>
            </div>
            <div className="bubble theirs from-farmer" style={{ alignSelf: "flex-start" }}>
              <div className="voice">
                <span className="voice-play"><Play aria-hidden="true" fill="currentColor" /></span>
                <span className="voice-wave" aria-hidden="true">
                  {WAVE.map((h, i) => <i key={i} className={i > 9 ? "later" : ""} style={{ height: h }} />)}
                </span>
                <span className="small muted">0:06</span>
              </div>
              Yes, it's 11%. Dried it just yesterday.
              <div className="orig">हाँ, 11% है। कल ही सुखाया है।</div>
              <div className="meta">Voice note, translated from Hindi, 9:14 am</div>
            </div>
          </div>
          <div>
            <h2>Speak Hindi. Read English. Nobody gets lost.</h2>
            <p className="lead">
              Type or send a voice note in your own language. The other side reads it in theirs,
              and can always tap to see the original words.
            </p>
            <div className="lang-chips">{LANGS.map((l) => <span key={l}>{l}</span>)}</div>
          </div>
        </section>
      </div>

      {/* how it works */}
      <section className="lp-section" id="how">
        <h2>From field to signed contract</h2>
        <ol className="lp-steps">
          <li>
            <span className="lp-step-n">Step 1</span>
            <h3>Verify once</h3>
            <p>Upload your Aadhaar and PAN. The details are read automatically and checked by our team.</p>
          </li>
          <li>
            <span className="lp-step-n">Step 2</span>
            <h3>List or browse</h3>
            <p>Farmers post crops with photos and harvest dates. Buyers filter by crop, place and price.</p>
          </li>
          <li>
            <span className="lp-step-n">Step 3</span>
            <h3>Negotiate</h3>
            <p>Send offers and counter-offers. Watch the two prices move closer on the ribbon.</p>
          </li>
          <li>
            <span className="lp-step-n">Step 4</span>
            <h3>Get a contract</h3>
            <p>Accept an offer and a PDF contract is created, with its fingerprint stored on the blockchain.</p>
          </li>
        </ol>
      </section>

      {/* trust */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <div className="lp-trust">
          <div>
            <h2>Anyone can check a contract is genuine</h2>
            <p className="lead">
              When a deal closes, the contract's fingerprint is written to the Ethereum blockchain.
              Upload the PDF and you'll see if even one character has changed.
            </p>
            <Link to="/verify" className="btn btn-ok" style={{ marginTop: "1.6rem" }}>
              <ShieldCheck aria-hidden="true" /> Check a contract
            </Link>
          </div>
          <div className="cert">
            <div className="cert-head">
              <span className="cert-seal"><Check aria-hidden="true" /></span>
              <div>
                <h3>Contract is genuine</h3>
                <div className="small muted">Certificate AGR-2026-000014</div>
              </div>
            </div>
            <div className="cert-row"><span>Crop</span><span>Yellow mustard seed, 12 quintal</span></div>
            <div className="cert-row"><span>Agreed price</span><span>₹5,550 per quintal</span></div>
            <div className="cert-row"><span>Network</span><span>Ethereum Sepolia</span></div>
          </div>
        </div>
      </section>

      {/* final call */}
      <section className="lp-section lp-final">
        <h2>Ready when your harvest is.</h2>
        <div className="lp-cta" style={{ marginTop: 0, justifyContent: "center" }}>
          <Link to="/register?role=FARMER" className="btn btn-primary">Start selling</Link>
          <Link to="/register?role=BUYER" className="btn btn-indigo">Start buying</Link>
        </div>
      </section>

      <footer className="foot">
        <div>
          <span>AgriShield</span>
          <Link to="/verify">Check a contract</Link>
        </div>
      </footer>
    </div>
  );
}