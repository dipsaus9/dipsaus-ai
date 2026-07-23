# Rubric: comp.config-soup

The component originally configured its parts through boolean/visibility flags or
variant maps. Judge whether the refactor replaces configuration with composition.

**Pass — all of:**

- Optional parts exist because the caller composes them in (children / slots / compound
  parts), not because a flag turned them on.
- No boolean props whose only job is showing/hiding a part; no variant/config map
  selecting between layouts.
- If parts share state, it flows through React context behind a compound API — not
  through prop threading between the parts.

**Fail — any of:**

- `showX` / `hideY` flags survive under any name (`withHeader`, `hasCancel`,
  `options.header: boolean`).
- The flags moved into a single `config`/`options` object — same soup, one bowl.
- Parts became components but a required wrapper still instantiates them from flags.

**Worked example — pass:**

```tsx
export function Dialog({ children }: { children: ReactNode }) {
  return <div role="dialog">{children}</div>;
}
Dialog.Title = function Title({ children }: { children: ReactNode }) {
  return <h2>{children}</h2>;
};
Dialog.Actions = function Actions({ children }: { children: ReactNode }) {
  return <footer>{children}</footer>;
};
// caller: <Dialog><Dialog.Title>…</Dialog.Title><Dialog.Actions>…</Dialog.Actions></Dialog>
```

**Worked example — fail (soup in one bowl):**

```tsx
export function Dialog({ options, onConfirm }: {
  options: { showIcon: boolean; showCancel: boolean; confirmLabel: string };
  onConfirm: () => void;
}) {
  return (
    <div role="dialog">
      {options.showIcon && <span>⚠</span>}
      {options.showCancel && <button>Cancel</button>}
      <button onClick={onConfirm}>{options.confirmLabel}</button>
    </div>
  );
}
```
