/**
 * Live order status with an elapsed-time counter.
 *
 * Two effects, each a genuine external synchronisation, is the ceiling the
 * effects budget allows (srp.effects-cap: at most 2 useEffect). Each effect
 * has one subject and returns its own cleanup; a third concern would move
 * into a custom hook.
 */
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

  // Effect 1: subscribe to the push source; unsubscribe on unmount/re-key.
  useEffect(() => {
    return subscribe(orderId, setStatus);
  }, [orderId, subscribe]);

  // Effect 2: wall-clock ticker — interval owned and cleared here.
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section aria-live="polite">
      <p>Order {orderId}</p>
      <p>Status: {status}</p>
      <p>Waiting {elapsedSeconds}s</p>
    </section>
  );
}
