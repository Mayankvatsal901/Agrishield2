import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Check, Copy, FileText, Flag, Languages, Mic, Send, ShieldCheck, Square, Trash2, X,
} from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";
import { getSocket } from "../lib/socket.js";
import { certFromUrl, listDeals, loadContract, rememberDeal, saveContract } from "../lib/deals.js";
import { money, shortId, time, unit as unitLabel, ago } from "../lib/format.js";
import { LANGUAGES, UNITS, UNIT_LABEL } from "../config.js";
import Ribbon from "../components/Ribbon.jsx";
import { Img, Loading, Notice, Pill, Spinner, useToast } from "../components/ui.jsx";

const POLL_MS = 6000;
const langName = (c) => LANGUAGES.find((l) => l.code === c)?.name || c;
// Round a suggested price to something people actually say: ₹10 steps, or ₹0.50 for cheap per-kg crops.
const roundPrice = (v) => (v >= 100 ? Math.round(v / 10) * 10 : Math.round(v * 2) / 2);
const upsert = (list, item) => (list.some((x) => x._id === item._id) ? list.map((x) => (x._id === item._id ? { ...x, ...item } : x)) : [...list, item]);

async function fetchAllMessages(chatId) {
  const first = await api.messages(chatId, { page: 1, limit: 100 });
  const { totalPages = 1 } = first.data.pagination || {};
  if (totalPages <= 1) return first.data.messages;
  const [a, b] = await Promise.all([
    api.messages(chatId, { page: totalPages - 1, limit: 100 }),
    api.messages(chatId, { page: totalPages, limit: 100 }),
  ]);
  return [...a.data.messages, ...b.data.messages];
}

export default function DealRoom() {
  const { dealId } = useParams();
  const { user, profile } = useAuth();
  const toast = useToast();
  const local = useMemo(() => listDeals(user.id).find((d) => d.dealId === dealId) || {}, [user.id, dealId]);

  const [history, setHistory] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [product, setProduct] = useState(null);
  const [chat, setChat] = useState(null);
  const [chatError, setChatError] = useState("");
  const [other, setOther] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contract, setContract] = useState(() => loadContract(dealId));
  const [live, setLive] = useState({ negotiation: false, chat: false });
  const [tab, setTab] = useState("offers"); // phones only: Offers or Chat
  const [preset, setPreset] = useState(null); // price picked from a quick-counter button
  const [seen, setSeen] = useState(null); // messages already seen, for the Chat tab badge

  const myRole = chat ? (String(chat.buyerId) === String(user.id) ? "BUYER" : "FARMER") : user.role;
  const myLang = chat ? (myRole === "BUYER" ? chat.buyerLanguage : chat.farmerLanguage) : profile?.language;
  const theirLang = chat ? (myRole === "BUYER" ? chat.farmerLanguage : chat.buyerLanguage) : null;

  /* ---------------- loading ---------------- */
  const loadOffers = useCallback(async () => {
    try {
      const r = await api.offers(dealId);
      setHistory(r.data);
      setLoadError("");
    } catch (e) {
      setLoadError(e.message);
    }
  }, [dealId]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  useEffect(() => {
    api.chatByDeal(dealId)
      .then((r) => setChat(r.data))
      .catch((e) => setChatError(e.message));
  }, [dealId]);

  useEffect(() => {
    if (!local.productId) return;
    api.product(local.productId).then((r) => setProduct(r.data)).catch(() => {});
  }, [local.productId]);

  useEffect(() => {
    if (!chat) return;
    const otherId = String(chat.buyerId) === String(user.id) ? chat.farmerId : chat.buyerId;
    api.userById(otherId).then((r) => setOther(r.data)).catch(() => {});
    fetchAllMessages(chat._id).then((m) => { setMessages(m); setSeen(m.length); }).catch(() => {});
  }, [chat, user.id]);

  // Keep this deal in the local index so it shows up under Deals.
  useEffect(() => {
    if (!history) return;
    const last = history.offers[history.offers.length - 1];
    rememberDeal(user.id, {
      dealId, role: myRole, status: history.dealStatus,
      unit: product?.unit || last?.unit || local.unit,
      ...(product && { productId: product._id, productName: product.name, image: product.images?.[0], listPrice: product.price }),
      lastPrice: last?.pricePerUnit, otherName: other?.fullName || local.otherName,
    });
  }, [history, product, other, myRole, dealId, user.id, local.unit, local.otherName]);

  /* ---------------- realtime ---------------- */
  useEffect(() => {
    const socket = getSocket();
    const negotiationRoom = `negotiation_${dealId}`;
    const join = () => {
      socket.emit("join-negotiation", { roomId: negotiationRoom });
      if (chat?._id) socket.emit("join-chat", { roomId: String(chat._id) });
    };
    const onJoinedNeg = ({ roomId }) => roomId === negotiationRoom && setLive((l) => ({ ...l, negotiation: true }));
    const onJoinedChat = ({ roomId }) => chat && roomId === String(chat._id) && setLive((l) => ({ ...l, chat: true }));
    const onError = () => {}; // room unknown to socket service (e.g. restarted): polling covers it
    const onDisconnect = () => setLive({ negotiation: false, chat: false });
    const onOffer = (offer) => {
      setHistory((h) => (h ? { ...h, offers: upsert(h.offers, offer), currentOfferId: offer._id } : h));
    };
    const onMessage = (m) => {
      if (chat && String(m.chatId) === String(chat._id)) setMessages((list) => upsert(list, m));
    };
    const onContract = (c) => {
      if (String(c.dealId) !== String(dealId)) return;
      saveContract(dealId, c);
      setContract(c);
      toast("Contract is ready");
      loadOffers();
    };

    socket.on("connect", join);
    socket.on("joined-negotiation", onJoinedNeg);
    socket.on("joined-chat", onJoinedChat);
    socket.on("error", onError);
    socket.on("disconnect", onDisconnect);
    socket.on("offer-created", onOffer);
    socket.on("message-received", onMessage);
    socket.on("contract-generated", onContract);
    if (socket.connected) join();

    return () => {
      socket.off("connect", join);
      socket.off("joined-negotiation", onJoinedNeg);
      socket.off("joined-chat", onJoinedChat);
      socket.off("error", onError);
      socket.off("disconnect", onDisconnect);
      socket.off("offer-created", onOffer);
      socket.off("message-received", onMessage);
      socket.off("contract-generated", onContract);
    };
  }, [dealId, chat, toast, loadOffers]);

  // Offer status changes (accept / reject) aren't broadcast, so poll quietly.
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) loadOffers(); }, POLL_MS);
    return () => clearInterval(t);
  }, [loadOffers]);
  useEffect(() => {
    if (!chat || live.chat) return;
    const t = setInterval(() => {
      if (!document.hidden) fetchAllMessages(chat._id).then((m) => setMessages((prev) => m.reduce(upsert, prev.filter((x) => !x.pending)))).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(t);
  }, [chat, live.chat]);
  // Don't rely only on the live "contract ready" message: once the deal is accepted,
  // ask Contract Service directly every few seconds until the PDF is there.
  useEffect(() => {
    if (!history || history.dealStatus === "OPEN" || contract?.pdfUrl) return;
    let stopped = false;
    const check = () =>
      api.contractByDeal(dealId)
        .then((r) => {
          if (stopped || !r.data?.pdfUrl) return;
          saveContract(dealId, r.data);
          setContract(r.data);
        })
        .catch(() => {}); // 404 until the contract exists
    check();
    const t = setInterval(() => { if (!document.hidden) check(); }, 5000);
    return () => { stopped = true; clearInterval(t); };
  }, [dealId, history?.dealStatus, contract?.pdfUrl]);
  useEffect(() => { if (tab === "chat") setSeen(messages.length); }, [tab, messages.length]);
  useEffect(() => { setPreset(null); }, [history?.offers?.length]);

  /* ---------------- derived negotiation state ---------------- */
  const offers = history?.offers || [];
  const lastOf = (role) => [...offers].reverse().find((o) => o.offeredByRole === role && o.status !== "REJECTED");
  const lastBuyer = lastOf("BUYER");
  const lastFarmer = lastOf("FARMER");
  const accepted = offers.find((o) => o._id === history?.acceptedOfferId) || offers.find((o) => o.status === "ACCEPTED");
    // The latest offer is the one on the table. Whoever didn't send it can accept it.
  const latest = offers[offers.length - 1];
  const onTable = latest && latest.status === "PENDING" ? latest : null;
  const theirFinal = onTable && onTable.offeredByRole !== myRole ? onTable : null;
  const myFinal = onTable && onTable.isFinalOffer && onTable.offeredByRole === myRole ? onTable : null;
  const open = history?.dealStatus === "OPEN";
  const unit = product?.unit || offers[offers.length - 1]?.unit || local.unit || "KG";
  const listPrice = product?.price || local.listPrice;

  const ribbonHistory = offers
    .filter((o) => o !== lastBuyer && o !== lastFarmer)
    .map((o) => ({ side: o.offeredByRole === "BUYER" ? "buyer" : "farmer", price: o.pricePerUnit }));

  if (loadError && !history) {
    return (
      <div className="page">
        <Link to="/app/deals" className="back"><ArrowLeft aria-hidden="true" /> Deals</Link>
        <Notice tone="bad" title="This deal room couldn't be opened">{loadError}</Notice>
      </div>
    );
  }
  if (!history) return <Loading label="Opening deal room" />;

  const title = product?.name || local.productName || `Deal ${shortId(dealId)}`;
  const theirPrice = myRole === "BUYER" ? lastFarmer?.pricePerUnit || listPrice : lastBuyer?.pricePerUnit;
  const myLast = myRole === "BUYER" ? lastBuyer?.pricePerUnit : lastFarmer?.pricePerUnit || listPrice;
  const halfwayTo = (price) => {
    if (!(myLast > 0) || !(price > 0) || myLast === price) return null;
    const h = roundPrice((myLast + price) / 2);
    return h === myLast || h === price ? null : h;
  };
  const unseen = seen === null ? 0 : Math.max(0, messages.length - seen);
  const counterAt = (price) => {
    setPreset({ price, at: Date.now() });
    setTab("offers");
  };

  return (
    <div className="page" style={{ maxWidth: 1240 }}>
      <Link to="/app/deals" className="back"><ArrowLeft aria-hidden="true" /> Deals</Link>

      <header className="room-head">
        <div className="list-thumb"><Img src={product?.images?.[0] || local.image} alt="" /></div>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>{title}</h1>
          <div className="small muted">
            {other ? `With ${other.fullName}, ${myRole === "BUYER" ? "farmer" : "buyer"}` : `You're the ${myRole === "BUYER" ? "buyer" : "farmer"}`}
            {listPrice ? `. Listed at ${money(listPrice)} / ${unitLabel(unit)}` : ""}
          </div>
        </div>
        <div className="row" style={{ gap: "0.6rem" }}>
          <span className={`live ${live.negotiation ? "on" : ""}`} title={live.negotiation ? "Updates arrive instantly" : "Checking for updates every few seconds"}>
            <i aria-hidden="true" /> {live.negotiation ? "Live" : "Auto-refresh"}
          </span>
          <Pill status={history.dealStatus} />
          <CopyLink dealId={dealId} />
        </div>
      </header>

      <div className="room-tabs segmented" role="tablist" aria-label="Deal room sections">
        <button type="button" role="tab" aria-selected={tab === "offers"} aria-pressed={tab === "offers"} onClick={() => setTab("offers")}>
          Offers
        </button>
        <button type="button" role="tab" aria-selected={tab === "chat"} aria-pressed={tab === "chat"} onClick={() => setTab("chat")}>
          Chat {unseen > 0 && <span className="count" aria-label={`${unseen} new`}>{unseen}</span>}
        </button>
      </div>

      <div className="room" data-tab={tab}>
        <div className="stack room-offers" style={{ "--gap": "1.25rem" }}>
          <section className="panel panel-ribbon" aria-label="Price comparison">
            <Ribbon
              unit={unit}
              buyer={lastBuyer?.pricePerUnit}
              farmer={lastFarmer?.pricePerUnit || listPrice}
              farmerLabel={lastFarmer ? "Farmer asks" : "Listed price"}
              agreed={accepted?.pricePerUnit}
              history={ribbonHistory}
            />
          </section>

          {!open && (
            <ContractCard status={history.dealStatus} contract={contract} accepted={accepted} unit={unit} />
          )}

          {open && theirFinal && (
            <FinalAsk offer={theirFinal} dealId={dealId} onDone={loadOffers} otherName={other?.fullName} halfway={halfwayTo(theirFinal.pricePerUnit)} onCounter={counterAt} />
          )}

          {open && (
            <section className="panel">
              <OfferComposer
                key={offers.length}
                dealId={dealId}
                unit={unit}
                myRole={myRole}
                suggestedQty={offers[offers.length - 1]?.quantity || product?.quantity || ""}
                theirPrice={theirPrice}
                halfway={halfwayTo(theirPrice)}
                preset={preset}
                waitingOnMyFinal={Boolean(myFinal)}
                onSent={(o) => { setPreset(null); setHistory((h) => ({ ...h, offers: upsert(h.offers, o) })); }}
              />
            </section>
          )}

          <section className="stack" style={{ "--gap": "0.6rem" }} aria-labelledby="hist">
            <h2 id="hist" style={{ fontSize: "var(--step-1)" }}>Offer history</h2>
            {offers.length === 0 ? (
              <p className="muted">No offers yet. {myRole === "BUYER" ? "Start with the price you'd like to pay." : "Wait for the buyer, or send your own asking price."}</p>
            ) : (
              <div className="timeline">
                {[...offers].reverse().map((o) => {
                  const mine = o.offeredByRole === myRole;
                  return (
                    <div key={o._id} className={`offer ${o.offeredByRole === "BUYER" ? "buyer" : "farmer"} ${o.isFinalOffer ? "final" : ""} ${o.status === "ACCEPTED" ? "accepted" : ""} ${o.status === "REJECTED" ? "rejected" : ""}`}>
                      <div className="offer-who">{mine ? "You" : o.offeredByRole === "BUYER" ? "Buyer" : "Farmer"}</div>
                      <div>
                        <div className="offer-price">{money(o.pricePerUnit)} / {unitLabel(o.unit)}</div>
                        <div className="offer-sub">{o.quantity} {unitLabel(o.unit)}, total {money(o.quantity * o.pricePerUnit)}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        {o.isFinalOffer && <div><Pill status={o.status === "PENDING" ? "FINAL_OFFER" : o.status} /></div>}
                        <div className="offer-sub">{ago(o.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="room-chat">
        <Chat
          chat={chat}
          chatError={chatError}
          messages={messages}
          setMessages={setMessages}
          myRole={myRole}
          myLang={myLang}
          theirLang={theirLang}
          otherName={other?.fullName}
          userId={user.id}
          live={live.chat}
        />
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */

function CopyLink({ dealId }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/app/deals/${dealId}`);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch { /* clipboard blocked */ }
  };
  return (
    <button className="icon-btn" onClick={copy} aria-label="Copy link to this deal room" title="Copy link to this deal room">
      {done ? <Check /> : <Copy />}
    </button>
  );
}

function OfferComposer({ dealId, unit, myRole, suggestedQty, theirPrice, halfway, preset, waitingOnMyFinal, onSent }) {
  const toast = useToast();
  const [qty, setQty] = useState(String(suggestedQty || ""));
  const [price, setPrice] = useState("");
  const [final, setFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = Number(qty) * Number(price);
  const valid = Number(qty) > 0 && Number(price) > 0;

  // A quick-counter button elsewhere on the page fills the price and brings you here.
  useEffect(() => {
    if (!preset) return;
    if (preset.price) setPrice(String(preset.price));
    const el = document.getElementById("op");
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      setTimeout(() => el.focus({ preventScroll: true }), 300);
    }
  }, [preset]);

  const send = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      const r = await api.makeOffer(dealId, {
        quantity: Number(qty), pricePerUnit: Number(price), unit: UNITS.includes(unit) ? unit : "KG", isFinalOffer: final,
      });
      onSent(r.data);
      toast(final ? "Final offer sent" : "Offer sent");
      setPrice("");
      setFinal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="composer" onSubmit={send} noValidate>
      <h2 style={{ fontSize: "var(--step-1)" }}>{myRole === "BUYER" ? "Make an offer" : "Send a counter-offer"}</h2>
      {theirPrice > 0 && (
        <div className="quick">
          <span>Quick price:</span>
          {halfway && (
            <button type="button" onClick={() => setPrice(String(halfway))}>{money(halfway)} (meet halfway)</button>
          )}
          <button type="button" onClick={() => setPrice(String(theirPrice))}>Match {money(theirPrice)}</button>
        </div>
      )}
      {waitingOnMyFinal && (
        <Notice tone="info">Your final offer is waiting for a reply. A new offer here will become the latest one.</Notice>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      <div className="composer-row">
        <div className="field">
          <label htmlFor="oq">Quantity ({UNIT_LABEL[unit] || unit})</label>
          <input id="oq" className="input num" type="number" min="1" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="op">Price per {UNIT_LABEL[unit] || unit}</label>
          <div className="input-affix"><span>₹</span>
            <input id="op" className="input num" type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="composer-total">
        <span className="muted">Total</span>
        <b>{valid ? money(total) : "—"}</b>
      </div>
      <label className="check">
        <input type="checkbox" checked={final} onChange={(e) => setFinal(e.target.checked)} />
        <span>Make this my final offer <span className="faint small">(the other side must accept or reject)</span></span>
      </label>
      <button className={`btn ${final ? "btn-ink" : myRole === "BUYER" ? "btn-indigo" : "btn-primary"}`} disabled={!valid || busy}>
        {busy ? <Spinner /> : final ? <Flag aria-hidden="true" /> : <Send aria-hidden="true" />}
        {final ? "Send final offer" : "Send offer"}
      </button>
    </form>
  );
}

function FinalAsk({ offer, dealId, onDone, otherName, halfway, onCounter }) {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const act = async (action) => {
    setBusy(action);
    setError("");
    try {
      await api.respond(dealId, offer._id, action);
      toast(action === "ACCEPT" ? "Offer accepted. Preparing the contract." : "Final offer declined. You can keep negotiating.");
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const who = otherName ? otherName.split(" ")[0] : offer.offeredByRole === "BUYER" ? "The buyer" : "The farmer";
  const u = unitLabel(offer.unit);
  return (
    <section className="final-ask stack" style={{ "--gap": "0.9rem" }} aria-live="polite">
      <div>
        <div className="turn-label">Your turn</div>
        <h3>{who} {offer.isFinalOffer ? "sent a final offer of" : "offered"} {money(offer.pricePerUnit)} per {u}</h3>
        <p className="num">{offer.quantity} {u}, total <b>{money(offer.quantity * offer.pricePerUnit)}</b></p>
      </div>
      {error && <Notice tone="bad">{error}</Notice>}
      <div className="row">
        <button className="btn btn-ok btn-accept" onClick={() => act("ACCEPT")} disabled={!!busy}>
          {busy === "ACCEPT" ? <Spinner /> : <Check aria-hidden="true" />} Accept {money(offer.pricePerUnit)}
        </button>
        {offer.isFinalOffer ? (
          <button className="btn btn-ghost" onClick={() => act("REJECT")} disabled={!!busy}>
            {busy === "REJECT" ? <Spinner /> : <X aria-hidden="true" />} Decline
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={() => onCounter(null)} disabled={!!busy}>Counter-offer</button>
        )}
      </div>
      {!offer.isFinalOffer && halfway && (
        <div className="quick">
          <span>Quick counter:</span>
          <button type="button" onClick={() => onCounter(halfway)}>{money(halfway)} (meet halfway)</button>
        </div>
      )}
      <p className="small muted">
        Accepting closes the negotiation and creates a contract for both of you.
        {offer.isFinalOffer && " This is their final offer, so you can accept or decline it."}
      </p>
    </section>
  );
}

function ContractCard({ status, contract, accepted, unit }) {
    const cert = contract ? contract.certificateNumber || certFromUrl(contract.pdfUrl) : "";
  return (
    <section className="contract" aria-live="polite">
      <div className="row between">
        <h3>{contract ? "Contract ready" : status === "CONTRACT_PENDING" ? "Preparing your contract" : "Negotiation closed"}</h3>
        {contract ? <ShieldCheck aria-hidden="true" color="#7fd3a0" /> : <Spinner />}
      </div>
      {accepted && (
        <p className="num">
          {accepted.quantity} {unitLabel(accepted.unit || unit)} at {money(accepted.pricePerUnit)}, total <b style={{ color: "#fff" }}>{money(accepted.quantity * accepted.pricePerUnit)}</b>
        </p>
      )}
      {contract ? (
        <>
          {cert && <p className="small">Certificate {cert}</p>}
          {contract.blockchainHash && (
            <div>
              <div className="small" style={{ marginBottom: 4 }}>Fingerprint stored on the blockchain</div>
              <div className="hash">{contract.blockchainHash}</div>
            </div>
          )}
          <div className="row">
            {contract.pdfUrl && (
              <a className="btn btn-primary" href={contract.pdfUrl} target="_blank" rel="noreferrer"><FileText aria-hidden="true" /> Open contract PDF</a>
            )}
            <Link className="btn btn-ghost" to={`/verify${cert ? `?cert=${cert}` : ""}`}><ShieldCheck aria-hidden="true" /> Check it</Link>
          </div>
        </>
      ) : (
        <p className="small">
          The PDF is being generated and its fingerprint recorded on the blockchain. It appears here when ready. Keep this page open.
        </p>
      )}
    </section>
  );
}

/* ================================================================ */

function Chat({ chat, chatError, messages, setMessages, myRole, myLang, theirLang, otherName, userId, live }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [rec, setRec] = useState(null); // { recorder, started, chunks }
  const [elapsed, setElapsed] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - rec.started) / 1000)), 250);
    return () => clearInterval(t);
  }, [rec]);

  if (chatError || !chat) {
    return (
      <section className="panel chat" aria-label="Chat">
        <div className="chat-head"><h2 style={{ fontSize: "var(--step-1)" }}>Chat</h2></div>
        <div className="chat-body" style={{ justifyContent: "center", alignItems: "center" }}>
          {chatError ? <p className="muted small" style={{ textAlign: "center", maxWidth: "32ch" }}>Chat isn't available for this deal: {chatError}</p> : <Spinner />}
        </div>
        <div />
      </section>
    );
  }

  const sendText = async (e) => {
    e?.preventDefault();
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { _id: tempId, pending: true, senderId: userId, senderRole: myRole, originalMessage: msg, messageType: "TEXT", createdAt: new Date().toISOString() }]);
    setText("");
    try {
      const r = await api.sendText(chat._id, { senderId: userId, senderRole: myRole, message: msg, messageType: "TEXT" });
      setMessages((m) => upsert(m.filter((x) => x._id !== tempId), r.data));
    } catch (err) {
      setMessages((m) => m.filter((x) => x._id !== tempId));
      setText(msg);
      toast(err.message, "bad");
    } finally {
      setSending(false);
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.start();
      setElapsed(0);
      setRec({ recorder, started: Date.now(), chunks, stream, mime: recorder.mimeType || mime || "audio/webm" });
    } catch {
      toast("Allow microphone access to send a voice message", "bad");
    }
  };

  const stopRec = (send) => {
    if (!rec) return;
    const { recorder, chunks, stream, mime } = rec;
    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setRec(null);
      if (!send || !chunks.length) return;
      const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      const form = new FormData();
      form.append("audio", blob, `voice-${Date.now()}.${ext}`);
      form.append("senderId", userId);
      form.append("senderRole", myRole);
      form.append("messageType", "VOICE");
      const tempId = `tmp-${Date.now()}`;
      setMessages((m) => [...m, { _id: tempId, pending: true, senderId: userId, senderRole: myRole, messageType: "VOICE", originalMessage: "Turning your voice note into text…", createdAt: new Date().toISOString() }]);
      setSending(true);
      try {
        const r = await api.sendVoice(chat._id, form);
        setMessages((m) => upsert(m.filter((x) => x._id !== tempId), r.data));
      } catch (err) {
        setMessages((m) => m.filter((x) => x._id !== tempId));
        toast(`Voice message failed: ${err.message}`, "bad");
      } finally {
        setSending(false);
      }
    };
    recorder.stop();
  };

  const translating = myLang && theirLang && myLang !== theirLang;
  let lastDay = "";

  return (
    <section className="panel chat" aria-label="Chat">
      <div className="chat-head">
        <div>
          <h2 style={{ fontSize: "var(--step-1)" }}>{otherName ? `Chat with ${otherName}` : "Chat"}</h2>
          {translating && (
            <div className="small muted row" style={{ gap: "0.3rem" }}>
              <Languages size={14} aria-hidden="true" /> You read {langName(myLang)}, they read {langName(theirLang)}
            </div>
          )}
        </div>
        <span className={`live ${live ? "on" : ""}`}><i aria-hidden="true" /> {live ? "Live" : "Auto-refresh"}</span>
      </div>

      <div className="chat-body" ref={bodyRef} aria-live="polite">
        {messages.length === 0 && (
          <p className="muted small" style={{ margin: "auto", textAlign: "center", maxWidth: "30ch" }}>
            Ask about quality, delivery or payment. {translating ? "Messages are translated automatically." : ""}
          </p>
        )}
        {messages.map((m) => {
          const day = new Date(m.createdAt).toDateString();
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m._id} style={{ display: "contents" }}>
              {showDay && <span className="chat-day">{new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
              <Bubble m={m} mine={String(m.senderId) === String(userId)} myLang={myLang} />
            </div>
          );
        })}
      </div>

      <form className="chat-foot" onSubmit={sendText}>
        {rec ? (
          <>
            <div className="rec" role="status"><i aria-hidden="true" /> Recording {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</div>
            <button type="button" className="icon-btn" onClick={() => stopRec(false)} aria-label="Discard recording"><Trash2 /></button>
            <button type="button" className="icon-btn mic-on" onClick={() => stopRec(true)} aria-label="Stop and send voice message"><Square /></button>
          </>
        ) : (
          <>
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <textarea
              id="chat-input" className="textarea" rows={1} placeholder="Write a message"
              value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
            />
            {text.trim() ? (
              <button className="icon-btn send-btn" aria-label="Send message" disabled={sending}><Send /></button>
            ) : (
              <button type="button" className="icon-btn" onClick={startRec} aria-label="Record a voice message" title="Record a voice message" disabled={sending || !navigator.mediaDevices}><Mic /></button>
            )}
          </>
        )}
      </form>
    </section>
  );
}

function Bubble({ m, mine, myLang }) {
  const [flip, setFlip] = useState(false);
  const hasTranslation = Boolean(m.translatedMessage);
  // Theirs: read the translation (it's in my language). Mine: read what I wrote.
  const primary = !mine && hasTranslation && (!myLang || m.translatedLanguage === myLang) ? m.translatedMessage : m.originalMessage;
  const secondary = hasTranslation ? (primary === m.translatedMessage ? m.originalMessage : m.translatedMessage) : null;

  return (
    <div className={`bubble ${mine ? "mine" : "theirs"} ${m.senderRole === "FARMER" ? "from-farmer" : "from-buyer"} ${m.pending ? "pending" : ""}`}>
      <div>{primary}</div>
      {secondary && flip && <div className="orig">{secondary}</div>}
      <div className="meta">
        {m.messageType === "VOICE" && <><Mic aria-hidden="true" /> Voice</>}
        <span>{m.pending ? "Sending…" : time(m.createdAt)}</span>
        {secondary && (
          <button type="button" className="toggle" onClick={() => setFlip(!flip)}>
            {flip ? "Hide" : mine ? "Show translation" : "Show original"}
          </button>
        )}
      </div>
    </div>
  );
}