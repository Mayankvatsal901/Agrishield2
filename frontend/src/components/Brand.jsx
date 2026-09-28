import { Link } from "react-router-dom";

export function BrandMark({ className = "brand-mark" }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#EBA92E" />
      <path d="M18 7c5.5 3.2 8.6 7.6 8.6 12.8a8.6 8.6 0 0 1-17.2 0C9.4 14.6 12.5 10.2 18 7z" fill="#15130D" />
      <path d="M18 13.5v14M18 20l-3.6-3.2M18 23.4l3.6-3.2" stroke="#EBA92E" strokeWidth="1.9" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Brand({ to = "/" }) {
  return (
    <Link to={to} className="brand" aria-label="AgriShield home">
      <BrandMark />
      <span className="brand-name">AgriShield</span>
    </Link>
  );
}