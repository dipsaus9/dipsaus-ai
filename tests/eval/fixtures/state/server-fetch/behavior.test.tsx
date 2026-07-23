import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerOrdersPanel } from "./Bad";
import { LiveInventoryBadge } from "./Good";

describe("state/server-fetch", () => {
  it("Bad shows a loading state, then the fetched orders", async () => {
    const api = {
      getOrders: () =>
        Promise.resolve([
          { id: "SO-1", total: 100 },
          { id: "SO-2", total: 62.5 },
        ]),
    };
    render(<CustomerOrdersPanel customerId="cus_9" api={api} />);
    expect(screen.getByText("Loading orders…")).toBeDefined();
    expect(await screen.findByText("SO-2 — €62.50")).toBeDefined();
  });

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
