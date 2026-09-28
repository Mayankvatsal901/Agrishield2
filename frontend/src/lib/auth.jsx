import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";

const AuthCtx = createContext(null);
const USER_KEY = "agrishield.user";

function decode(token) {
  try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
  catch { return null; }
}

function initialUser() {
  const t = getToken();
  const claims = t && decode(t);
  if (!claims || (claims.exp && claims.exp * 1000 < Date.now())) { setToken(null); return null; }
  let stored = null;
  try { stored = JSON.parse(localStorage.getItem(USER_KEY)); } catch { /* ignore */ }
  return { ...stored, id: claims.userId, role: claims.role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUser);
  // profile: undefined = loading, null = not created yet, object = loaded
  const [profile, setProfile] = useState(undefined);
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [profileError, setProfileError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!getToken()) return;
    setProfileError("");
    try {
      const res = await api.getProfile();
      setProfile(res.data.profile);
      setBuyerProfile(res.data.buyerProfile);
    } catch (e) {
      if (e.status === 404) setProfile(null);
      else { setProfileError(e.message); setProfile((p) => (p === undefined ? false : p)); }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === "ADMIN") setProfile(false);
    else loadProfile();
  }, [user, loadProfile]);

  const signIn = useCallback((token, u) => {
    setToken(token);
    const claims = decode(token) || {};
    const next = { id: claims.userId || u?.id, email: u?.email, role: claims.role || u?.role };
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setProfile(undefined);
    setUser(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setProfile(undefined);
    setBuyerProfile(null);
  }, []);

  useEffect(() => {
    const onUnauth = () => signOut();
    window.addEventListener("agrishield:unauthorized", onUnauth);
    return () => window.removeEventListener("agrishield:unauthorized", onUnauth);
  }, [signOut]);

  return (
    <AuthCtx.Provider
      value={{ user, profile, buyerProfile, profileError, signIn, signOut, loadProfile, setProfile, setBuyerProfile }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
