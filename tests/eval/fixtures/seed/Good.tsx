// Seed fixture — the clean twin of Bad.tsx: derived value computed in render.
export function Good({ first, last }: { first: string; last: string }) {
  const fullName = `${first} ${last}`;

  return <p>Hello, {fullName}</p>;
}
