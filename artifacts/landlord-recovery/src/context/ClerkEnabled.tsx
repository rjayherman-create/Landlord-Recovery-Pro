import { createContext, useContext } from "react";

export const ClerkEnabledContext = createContext(false);

export function useClerkEnabled() {
  return useContext(ClerkEnabledContext);
}
