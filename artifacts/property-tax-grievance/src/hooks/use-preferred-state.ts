import { useState, useCallback } from "react";

const STORAGE_KEY = "taxappeal_preferred_state";

export type AppState = "NY" | "NJ" | "TX" | "FL";

export const STATE_META: Record<AppState, { flag: string; name: string; form: string; body: string; verb: string }> = {
  NY: { flag: "🗽", name: "New York",    form: "RP-524",             body: "Board of Assessment Review",     verb: "grievance" },
  NJ: { flag: "🔵", name: "New Jersey",  form: "Form A-1",           body: "County Board of Taxation",       verb: "appeal"    },
  TX: { flag: "⭐", name: "Texas",       form: "Notice of Protest",  body: "Appraisal Review Board",         verb: "protest"   },
  FL: { flag: "🌴", name: "Florida",     form: "DR-486 Petition",    body: "Value Adjustment Board",         verb: "petition"  },
};

export function usePreferredState() {
  const [preferredState, _setPreferred] = useState<AppState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in STATE_META) return stored as AppState;
    } catch {}
    return "NY";
  });

  const setPreferredState = useCallback((s: AppState) => {
    _setPreferred(s);
    try { localStorage.setItem(STORAGE_KEY, s); } catch {}
  }, []);

  return { preferredState, setPreferredState, meta: STATE_META[preferredState] };
}
