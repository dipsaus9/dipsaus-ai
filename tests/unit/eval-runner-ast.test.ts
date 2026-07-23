import { describe, expect, it } from "vitest";
import { bannedPatterns, capViolations, measureComponents } from "../eval/runner/ast";

const OVER_CAPS = `import { useEffect, useMemo, useRef, useState } from "react";

export function Overloaded({ a, b, c, d, e, f, g }: {
  a: string; b: string; c: string; d: string; e: string; f: string; g: string;
}) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const ref = useRef(null);
  const memo = useMemo(() => a + b, [a, b]);
  useEffect(() => { document.title = a; }, [a]);
  useEffect(() => { document.title = b; }, [b]);
  useEffect(() => { document.title = c; }, [c]);
  return (
    <main ref={ref}>
      <section>
        <div>
          <ul>
            <li>
              <span>{memo}{x}{y}{d}{e}{f}{g}{String(setX)}{String(setY)}</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
`;

const WITHIN_CAPS = `import { useState } from "react";

export function Compact({ label, value }: { label: string; value: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button type="button" onClick={() => setOpen(!open)}>{label}</button>
      {open && <p>{value}</p>}
    </section>
  );
}

function useHelper(n: number) {
  const [v] = useState(n);
  return v;
}
`;

describe("measureComponents / capViolations", () => {
  it("measures all five caps on an overloaded component", () => {
    const [metrics] = measureComponents("Overloaded.tsx", OVER_CAPS);
    expect(metrics).toMatchObject({
      name: "Overloaded",
      props: 7,
      hooks: 7,
      effects: 3,
      jsxDepth: 6,
    });
    const caps = capViolations(measureComponents("Overloaded.tsx", OVER_CAPS));
    expect(caps.map((c) => c.cap).sort()).toEqual(["effects", "hooks", "jsx-depth", "props"]);
  });

  it("reports nothing on a component within caps and skips custom hooks", () => {
    const metrics = measureComponents("Compact.tsx", WITHIN_CAPS);
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({ name: "Compact", props: 2, hooks: 1, effects: 0, jsxDepth: 2 });
    expect(capViolations(metrics)).toEqual([]);
  });

  it("computes LOC as the declaration-to-brace span", () => {
    const [metrics] = measureComponents("Compact.tsx", WITHIN_CAPS);
    expect(metrics?.loc).toBe(9);
  });
});

const DERIVED = `import { useEffect, useState } from "react";

export function Derived({ first, last }: { first: string; last: string }) {
  const [full, setFull] = useState("");
  useEffect(() => {
    setFull(first + " " + last);
  }, [first, last]);
  return <p>{full}</p>;
}
`;

const EFFECT_FETCH = `import { useEffect, useState } from "react";

export function Fetches({ api }: { api: { load: () => Promise<string[]> } }) {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    api.load().then((result) => setItems(result));
  }, [api]);
  return <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}
`;

const LEGIT_EFFECTS = `import { useEffect, useState } from "react";

export function Subscribed({ subscribe }: { subscribe: (cb: (n: number) => void) => () => void }) {
  const [level, setLevel] = useState(0);
  const [ticks, setTicks] = useState(0);
  useEffect(() => {
    return subscribe(setLevel);
  }, [subscribe]);
  useEffect(() => {
    const timer = setInterval(() => setTicks((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);
  return <p>{level}{ticks}</p>;
}
`;

describe("bannedPatterns", () => {
  it("flags a direct setter call in an effect as derived-state-in-effect", () => {
    expect(bannedPatterns("Derived.tsx", DERIVED)).toEqual([
      { component: "Derived", pattern: "derived-state-in-effect" },
    ]);
  });

  it("flags setter-in-then as effect-fetch, not derived state", () => {
    expect(bannedPatterns("Fetches.tsx", EFFECT_FETCH)).toEqual([
      { component: "Fetches", pattern: "effect-fetch" },
    ]);
  });

  it("leaves subscription and timer effects clean", () => {
    expect(bannedPatterns("Subscribed.tsx", LEGIT_EFFECTS)).toEqual([]);
  });
});
