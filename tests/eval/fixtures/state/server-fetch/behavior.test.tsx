import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerOrdersPanel } from "./Bad";

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
});
