# AgriShield frontend

React + Vite frontend for the AgriShield microservices.

## Run it

```bash
cd frontend
npm install
cp .env.example .env   # adjust ports if yours differ
npm run dev            # http://localhost:5173
```

Start the backend services first. The API gateway doesn't proxy requests yet, so the
frontend calls each service directly on the port set in `.env`.
Run socket-service with `PORT=5009` (it and ml-service both default to 5008).

## Pages

| Route | Who | What |
|---|---|---|
| `/` | everyone | Landing page |
| `/register`, `/login` | everyone | Accounts (Farmer or Buyer) |
| `/onboarding` | new users | Profile, chat language, location, business details |
| `/verify` | everyone | Check a contract PDF against its blockchain record |
| `/app` | farmer, buyer | Home dashboard |
| `/app/market`, `/app/market/:id` | all | Browse crops, product detail, start negotiation |
| `/app/listings` (+ `/new`, `/:id/edit`) | farmer | Manage crop listings |
| `/app/kyc` | farmer, buyer | Aadhaar and PAN upload, OCR results, review status |
| `/app/deals`, `/app/deals/:id` | farmer, buyer | Deal list and deal room (offers, chat, contract) |
| `/app/profile` | farmer, buyer | Edit profile |
| `/app/admin/kyc` | admin | KYC review queue |

## Structure

```
src/
  config.js          service URLs, languages, units, categories
  lib/api.js         one function per backend endpoint
  lib/auth.jsx       token and profile state
  lib/socket.js      socket.io client (offer-created, message-received, contract-generated)
  lib/deals.js       local index of opened deals (until GET /api/deals/my exists)
  components/        layout, price ribbon, form and UI pieces
  pages/             one file per screen
```

Realtime updates use the socket service when it's reachable. When it isn't (or it was
restarted and forgot its rooms), the deal room polls every 6 seconds, so it keeps working.

See `BACKEND_NOTES.md` for backend fixes the frontend depends on.
