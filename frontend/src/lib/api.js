import { SERVICES } from "../config.js";

const TOKEN_KEY = "agrishield.token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

/**
 * request("market", "/api/marketplace", { query, body, form, method })
 * - body  -> JSON
 * - form  -> FormData (multipart, for images / pdf / audio)
 */
export async function request(service, path, opts = {}) {
  const { method = opts.body || opts.form ? "POST" : "GET", body, form, query, auth = true } = opts;
  const base = SERVICES[service];
  const url = new URL(path, base);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload });
  } catch {
    throw new ApiError(`Can't reach the ${service} service at ${base}. Check that it's running.`, 0);
  }

  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Express error pages are HTML: pull out the message inside <pre>, or strip the tags
    const pre = text.match(/<pre>([\s\S]*?)<\/pre>/i);
    const raw = pre ? pre[1] : text.replace(/<[^>]+>/g, " ");
    data = { message: raw.replace(/<br\s*\/?>/gi, " ").replace(/\s+/g, " ").trim().slice(0, 200) };
  }

  if (!res.ok || data?.success === false) {
    // Sign out only when our own auth middleware rejects the token,
    // not when some other 401 passes through (e.g. from Cloudinary).
    if (res.status === 401 && auth && token && /token/i.test(data?.message || "")) {
      window.dispatchEvent(new Event("agrishield:unauthorized"));
    }
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }
  return data;
}

export const api = {
  // Auth service
  register: (b) => request("auth", "/api/auth/register", { body: b, auth: false }),
  login: (b) => request("auth", "/api/auth/login", { body: b, auth: false }),
  me: () => request("auth", "/api/auth/me"),
  forgotPassword: (email) => request("auth", "/api/auth/forgot-password", { body: { email }, auth: false }),
  resetPassword: (b) => request("auth", "/api/auth/reset-password", { body: b, auth: false }),

  // User service
  getProfile: () => request("user", "/api/profile"),
  createProfile: (b) => request("user", "/api/profile", { body: b }),
  updateProfile: (b) => request("user", "/api/profile", { method: "PUT", body: b }),
  getKyc: () => request("user", "/api/kyc"),
  submitKyc: (form) => request("user", "/api/kyc", { form }),
  eligibility: () => request("user", "/api/internal/farmer/eligibility"),
  userById: (id) => request("user", `/api/internal/users/${id}`, { auth: false }),
  adminKycList: (query) => request("user", "/api/admin/kyc", { query }),
  adminKycDetail: (userId) => request("user", `/api/admin/kyc/${userId}`),
  adminApprove: (userId) => request("user", `/api/admin/kyc/${userId}/approve`, { method: "PUT" }),
  adminReject: (userId, reason) =>
    request("user", `/api/admin/kyc/${userId}/reject`, { method: "PUT", body: { reason } }),

  // Marketplace service
  browse: (query) => request("market", "/api/marketplace", { query, auth: false }),
  product: (id) => request("market", `/api/products/${id}`, { auth: false }),
  myProducts: () => request("market", "/api/products/my"),
  createProduct: (form) => request("market", "/api/products", { form }),
  updateProduct: (id, form) => request("market", `/api/products/${id}`, { method: "PUT", form }),
  deleteProduct: (id) => request("market", `/api/products/${id}`, { method: "DELETE" }),

  // Deal service
  startDeal: (productId) => request("deal", "/api/deals", { body: { productId } }),
  myDeals: () => request("deal", "/api/deals/my"), // optional endpoint, see BACKEND_NOTES.md
  offers: (dealId) => request("deal", `/api/deals/${dealId}/offers`),
  makeOffer: (dealId, b) => request("deal", `/api/deals/${dealId}/offers`, { body: b }),
  respond: (dealId, offerId, action) =>
    request("deal", `/api/deals/${dealId}/offers/${offerId}/respond`, { method: "PATCH", body: { action } }),
  // Contract service
  contractByDeal: (dealId) => request("contract", `/api/contracts/deal/${dealId}`),
  // Chat service
  chatByDeal: (dealId) => request("chat", `/api/chats/deal/${dealId}`),
  messages: (chatId, query) => request("chat", `/api/chats/${chatId}/messages`, { query }),
  sendText: (chatId, b) => request("chat", `/api/chats/${chatId}/messages`, { body: b }),
  sendVoice: (chatId, form) => request("chat", `/api/chats/${chatId}/messages`, { form }),

  // Blockchain service
  verify: (form) => request("chain", "/api/blockchain/verify", { form, auth: false }),
};
