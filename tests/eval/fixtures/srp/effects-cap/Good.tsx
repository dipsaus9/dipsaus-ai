// Clean twin — exactly 2 useEffect, sitting on the cap. A false-positive trap.
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

  return (
    <section aria-live="polite">
      <p>Order {orderId}</p>
      <p>Status: {status}</p>
      <p>Waiting {elapsedSeconds}s</p>
    </section>
  );
}
