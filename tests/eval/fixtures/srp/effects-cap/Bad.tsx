// Violates srp.effects-cap: 3 useEffect (> 2). Each effect is a legitimate
// external sync (subscription, timer, document title) — no derived state,
// no data fetching, so only the cap is broken.
import { useEffect, useState } from "react";

export function LiveOrderStatus({
  orderId,
  subscribe,
}: {
  orderId: string;
  subscribe: (orderId: string, onStatus: (status: string) => void) => () => void;
}) {
  const [status, setStatus] = useState("pending");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    return subscribe(orderId, setStatus);
  }, [orderId, subscribe]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.title = `Order ${orderId}: ${status}`;
  }, [orderId, status]);

  return (
    <section aria-live="polite">
      <p>Order {orderId}</p>
      <p>Status: {status}</p>
      <p>Waiting {elapsedSeconds}s</p>
    </section>
  );
}
