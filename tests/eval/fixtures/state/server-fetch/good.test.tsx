import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveInventoryBadge } from "./Good";

describe("state/server-fetch good twin", () => {
  it("Good reflects pushed inventory levels", () => {
    let push: ((level: number) => void) | undefined;
    const subscribe = (_sku: string, onLevel: (level: number) => void) => {
      push = onLevel;
      return () => {
        push = undefined;
      };
    };
    render(<LiveInventoryBadge sku="sku-7" subscribe={subscribe} />);
    expect(screen.getByText("…")).toBeDefined();
    act(() => push?.(3));
    expect(screen.getByText("3 in stock")).toBeDefined();
    act(() => push?.(0));
    expect(screen.getByText("Sold out")).toBeDefined();
  });
});
