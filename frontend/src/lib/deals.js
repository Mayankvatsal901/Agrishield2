// The deal service has no "list my deals" endpoint yet, so the browser keeps a
// small index of deals this user has opened. Everything else is rebuilt from the dealId.
const key = (userId) => `agrishield.deals.${userId}`;
const contractKey = (dealId) => `agrishield.contract.${dealId}`;

export function listDeals(userId) {
  try { return JSON.parse(localStorage.getItem(key(userId))) || []; } catch { return []; }
}

export function rememberDeal(userId, deal) {
  if (!userId || !deal?.dealId) return;
  const all = listDeals(userId);
  const prev = all.find((d) => d.dealId === deal.dealId) || {};
  const next = [{ ...prev, ...deal, touchedAt: new Date().toISOString() }, ...all.filter((d) => d.dealId !== deal.dealId)];
  localStorage.setItem(key(userId), JSON.stringify(next.slice(0, 100)));
}

export function forgetDeal(userId, dealId) {
  localStorage.setItem(key(userId), JSON.stringify(listDeals(userId).filter((d) => d.dealId !== dealId)));
}

export function saveContract(dealId, c) {
  localStorage.setItem(contractKey(dealId), JSON.stringify(c));
}
export function loadContract(dealId) {
  try { return JSON.parse(localStorage.getItem(contractKey(dealId))); } catch { return null; }
}

// Certificate numbers look like AGR-2026-000001; the PDF is stored under that name.
export const certFromUrl = (url = "") => (String(url).match(/AGR-\d{4}-\d+/) || [])[0] || "";
