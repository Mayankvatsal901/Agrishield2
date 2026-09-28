# AgriShield

Farmer-to-buyer crop marketplace. Farmers verify identity with Aadhaar/PAN (OCR), list crops,
and negotiate with buyers in a deal room with translated chat and voice notes. Accepting an
offer generates a PDF contract whose fingerprint goes on Ethereum Sepolia.

- Repo: github.com/Mayankvatsal901/Agrishield2, branch `dev`. Always work on `dev`.
- Backend written by a teammate; frontend (`frontend/`) built separately.
- Never commit `.env` files. Each service has its own gitignored `.env`.

## Stack
- Backend: Node + Express microservices (ESM), MongoDB Atlas (separate database per service),
  RabbitMQ (CloudAMQP), Cloudinary (images/PDFs), Socket.IO, Sarvam AI (translation,
  speech-to-text), Tesseract OCR.
- Frontend: React 18 + Vite, React Router, socket.io-client, lucide-react, plain CSS
  (`frontend/src/styles.css`, no Tailwind). Fonts self-hosted via @fontsource:
  Anek Latin (display, variable width) + Mukta (body, has Devanagari).

## Ports
auth 5001 · user 5002 · marketplace 5003 · deal 5004 · contract 5005 · notification 5006 ·
blockchain 5007 · ml 5008 · socket 5009 · chat 5010 (not 6000: browsers block it) ·
translation 5011 · frontend 5173

## Running
- Frontend: `cd frontend && npm install && npm run dev`
- Each service: `npm install` then its start script, from its own folder.
- Start contract, notification and socket services BEFORE accepting an offer
  (RabbitMQ drops messages when nobody is listening).
- Admin account: `npm run create-admin` in auth-service (needs ADMIN_EMAIL; password Admin@123).

## Environment rules
- `JWT_SECRET` identical in every service; `RABBITMQ_URL` identical everywhere.
- Cloudinary keys in user, marketplace and contract services. Cloudinary Settings → Security
  must allow delivery of PDF and ZIP files.
- Every `server.js` (and createAdmin.js, retryContracts.js) starts with a DNS fix, because
  Indian ISPs refuse the SRV lookups `mongodb+srv://` needs. Keep it in any new entry file:
  ```js
  import dns from "node:dns";
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  ```

## Frontend map
- `src/config.js` service URLs · `src/lib/api.js` all endpoints · `src/lib/auth.jsx` auth
  context · `src/lib/socket.js` · `src/lib/deals.js` local deal index · `src/lib/format.js`
- `src/pages/DealRoom.jsx`: offers, ribbon, chat, contract (the core screen)
- `src/components/Ribbon.jsx`: the price ribbon, the signature element

## Design system (keep to it)
- "Mandi rate board, made digital." Field green `--field #1E4A36` is the structure colour;
  mustard `--mustard #E3A21A` is ALWAYS the farmer side; indigo `--indigo #2D3A8C` is ALWAYS
  the buyer side. Background `--paper #EEF2EA`. Success `--leaf`, errors `--chili`.
- `.shell[data-role]` sets `--accent` per role (farmer mustard, buyer indigo).
- Prices use condensed heavy Anek Latin (`.rate` and the price classes) and `money()` from
  format.js (whole rupees print without ".00").
- The price ribbon is the one bold element; keep other screens calm. The only page-load
  animation is the "Agreed" stamp on the ribbon.
- Users include farmers on cheap phones: large tap targets (≥44px), high contrast, test
  at 390px wide. No all-caps labels.
- Use existing class names from styles.css before adding new ones.

## Known issues / to do
- [ ] Product delete broken: code sets status "DELETED" but enum in marketplace
      `models/Product.js` lists "DELETE". Fix the enum.
- [ ] Chat routes have no auth: senderId/senderRole come from the request body. Add JWT
      middleware, take the sender from req.user, check they belong to the deal.
- [ ] Failed PDF jobs are dropped (`channel.nack(message, false, false)`); retry script exists.
- [ ] Socket rooms are in memory; restarting socket-service loses them (frontend polls every 6s).
- [ ] Deal room on mobile is one long scroll; wants tabs (Offers / Chat).
- [ ] Blockchain service needs Sepolia RPC URL, wallet key, contract address.
- [ ] Translation service needs SARVAM_API_KEY.
- [ ] Multilingual chatbot with text-to-speech (the USP) not built; model trained by someone
      else. Plan: frontend calls one endpoint with a fixed request/response shape, mock reply
      until the model is ready. Undecided: separate assistant vs voice upgrade to deal chat.
- [ ] Email/phone OTP verification deferred (register sets emailVerified: true for now).

## Testing
- Buyer and farmer need separate accounts: one normal window, one private window
  (they share localStorage otherwise).
- A farmer needs admin-approved KYC before listing crops.
