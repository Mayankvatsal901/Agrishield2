import { useEffect, useState } from "react";
import { api } from "../lib/api.js";

/** Asks the user service whether this farmer can list crops (KYC approved). */
export function useEligibility() {
  const [state, setState] = useState(null);
  useEffect(() => {
    api.eligibility()
      .then((r) => setState(r.data))
      .catch((e) => setState({ canSell: false, reason: e.message }));
  }, []);
  return state;
}
