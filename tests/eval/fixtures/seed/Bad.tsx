// Seed fixture — deliberately violates `state.derived-effect`:
// fullName mirrors first/last via useEffect instead of being computed in render.
import { useEffect, useState } from "react";

export function Bad({ first, last }: { first: string; last: string }) {
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    setFullName(`${first} ${last}`);
  }, [first, last]);

  return <p>Hello, {fullName}</p>;
}
