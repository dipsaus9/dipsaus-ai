// Public API of the billing feature. The context is exported for billing's own
// components — consuming it from another feature is still a boundary violation.
import { createContext, type ReactNode } from "react";

export interface BillingState {
  outstandingBalance: number;
  currency: string;
}

export const BillingContext = createContext<BillingState>({
  outstandingBalance: 0,
  currency: "EUR",
});

export function BillingProvider({
  state,
  children,
}: {
  state: BillingState;
  children: ReactNode;
}) {
  return <BillingContext value={state}>{children}</BillingContext>;
}
