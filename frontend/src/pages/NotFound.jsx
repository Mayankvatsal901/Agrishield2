import { Link } from "react-router-dom";
import Brand from "../components/Brand.jsx";

export default function NotFound() {
  return (
    <>
      <header className="public-head"><Brand /></header>
      <div className="verify-wrap stack">
        <h1>This page doesn't exist</h1>
        <p className="muted">The link may be old or mistyped.</p>
        <Link to="/" className="btn btn-ink" style={{ justifySelf: "start", width: "fit-content" }}>Go to AgriShield</Link>
      </div>
    </>
  );
}
