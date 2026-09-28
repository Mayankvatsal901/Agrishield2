import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import {
  FileCheck2, Handshake, Home, IdCard, LogOut, Package, ShieldCheck, Store, UserRound,
} from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import Brand from "./Brand.jsx";
import { Loading, Notice } from "./ui.jsx";
import { initials } from "../lib/format.js";

const NAV = {
  FARMER: [
    { to: "/app", label: "Home", icon: Home, end: true },
    { to: "/app/listings", label: "My crops", icon: Package },
    { to: "/app/deals", label: "Deals", icon: Handshake },
    { to: "/app/market", label: "Market", icon: Store },
    { to: "/app/kyc", label: "Verification", icon: IdCard },
  ],
  BUYER: [
    { to: "/app", label: "Home", icon: Home, end: true },
    { to: "/app/market", label: "Market", icon: Store },
    { to: "/app/deals", label: "Deals", icon: Handshake },
    { to: "/verify", label: "Check contract", icon: FileCheck2 },
  ],
  ADMIN: [
    { to: "/app/admin/kyc", label: "KYC review", icon: ShieldCheck },
    { to: "/verify", label: "Check contract", icon: FileCheck2 },
  ],
};

const ROLE_NAME = { FARMER: "Farmer", BUYER: "Buyer", ADMIN: "Admin" };

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function Layout() {
  const { user, profile, profileError, signOut } = useAuth();
  const loc = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (user.role !== "ADMIN") {
    if (profile === undefined) return <Loading label="Opening your account" />;
    if (profile === null) return <Navigate to="/onboarding" replace />;
  }
  if (user.role === "ADMIN" && (loc.pathname === "/app" || loc.pathname === "/app/")) {
    return <Navigate to="/app/admin/kyc" replace />;
  }

  const items = NAV[user.role] || NAV.BUYER;
  const name = profile?.fullName || user.email || ROLE_NAME[user.role];
  const avatarClass = `avatar ${user.role === "BUYER" ? "buyer" : user.role === "ADMIN" ? "admin" : ""}`;

  return (
    <div className="shell" data-role={user.role}>
      <aside className="sidebar">
        <Brand to="/app" />
        <div className="side-role"><i aria-hidden="true" /> {user.role === "BUYER" ? "Buyer" : user.role === "ADMIN" ? "Admin" : "Farmer"} account</div>
        <nav className="nav" aria-label="Main">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon aria-hidden="true" /> {label}
            </NavLink>
          ))}
          {user.role !== "ADMIN" && (
            <NavLink to="/app/profile">
              <UserRound aria-hidden="true" /> Profile
            </NavLink>
          )}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <span className={avatarClass} aria-hidden="true">{initials(name)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="me-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div className="me-role">{ROLE_NAME[user.role]}</div>
            </div>
            <button className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut />
            </button>
          </div>
        </div>
      </aside>

      <header className="topbar">
        <Brand to="/app" />
        <div className="row">
          {user.role !== "ADMIN" && (
            <NavLink to="/app/profile" className={avatarClass} aria-label="Profile" style={{ textDecoration: "none" }}>
              {initials(name)}
            </NavLink>
          )}
          <button className="icon-btn" onClick={signOut} aria-label="Sign out"><LogOut /></button>
        </div>
      </header>

      <main className="main" id="main">
        {profileError && (
          <div className="page" style={{ paddingBottom: 0 }}>
            <Notice tone="warn" title="Some account details didn't load">{profileError}</Notice>
          </div>
        )}
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Main">
        {items.slice(0, 5).map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
