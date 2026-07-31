/**
 * Checkout form: three fields, a derived total, one submit callback.
 *
 * Five hooks — three field states, a ref, one memo — is the ceiling the hook
 * budget allows (srp.hooks-cap: at most 5). The total is derived with
 * useMemo rather than mirrored into state, and submit hands the values up
 * instead of owning order logic here.
 */
import { useMemo, useRef, useState } from "react";

interface CartItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function CheckoutForm({
  items,
  onSubmit,
}: {
  items: CartItem[];
  onSubmit: (email: string, address: string, shippingMethod: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const formRef = useRef<HTMLFormElement>(null);
  // Derived during render (memoised) — never synced into state via an effect.
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(email, address, shippingMethod);
      }}
    >
      <label>
        Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Address
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <label>
        Shipping
        <select
          value={shippingMethod}
          onChange={(e) => setShippingMethod(e.target.value)}
        >
          <option value="standard">Standard</option>
          <option value="express">Express</option>
        </select>
      </label>
      <p>Total: €{total.toFixed(2)}</p>
      <button type="submit">Place order</button>
    </form>
  );
}
