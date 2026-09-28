# Backend notes for the frontend

Issues found while wiring up the frontend, in priority order.

## 1. Add `GET /api/deals/my` (deal-service)

Without it, a farmer only sees a deal if the buyer shares the deal room link.
The frontend already calls this endpoint and uses it automatically once it exists.

`routes/deal.routes.js`:
```js
import { getMyDeals } from "../controllers/deal.controller.js";
router.get("/my", authMiddleware, getMyDeals); // register BEFORE any "/:dealId" routes
```

`controllers/deal.controller.js`:
```js
export const getMyDeals = async (req, res) => {
    try {
        const userId = req.user.userId;
        const deals = await Deal.find({ $or: [{ buyerId: userId }, { farmerId: userId }] })
            .sort({ updatedAt: -1 });
        return res.status(200).json({ success: true, data: deals });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
```

## 2. Missing import breaks the admin KYC panel (user-service)

`controllers/admin.kyc.controller.js` uses `adminKYCService` but never imports it. Add at the top:
```js
import * as adminKYCService from "../services/kyc.admin.service.js";
```

## 3. Deleting a product fails (marketplace-service)

`product.service.js` sets `status = "DELETED"`, but the model enum has `"DELETE"`.
Change the enum value in `models/Product.js` to `"DELETED"`.

## 4. Users can't sign in again after registering (auth-service)

`login` rejects users with `emailVerified: false`, and nothing ever sets it to true.
Either add an email verification flow or remove the check for now.

## 5. Port clash

socket-service and ml-service both default to 5008. Run socket-service on 5009
(the frontend's `.env.example` assumes this) or change one default.

## Smaller things

- `kyc.service.js`: the first-time `uploadKYC` path creates the record but doesn't `return kyc`. The frontend refetches, so it's harmless.
- Contract details only arrive through the `contract-generated` socket event. The frontend caches it in the browser. A `GET /api/contracts/deal/:dealId` route in contract-service would let a user see the contract on any device.
- Chat routes take `senderId` and `senderRole` from the request body with no auth middleware, so anyone can post as anyone. Consider adding `authMiddleware` and reading the sender from the token.
- Voice notes are transcribed with `language_code: "en-IN"` hard-coded in the Sarvam provider. Passing the sender's language would improve Hindi and regional voice notes.
