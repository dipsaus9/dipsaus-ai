import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveOrderStatus as BadStatus } from "./Bad";
import { LiveOrderStatus as GoodStatus } from "./Good";

function makeSubscribe() {
  let handler: ((status: string) => void) | undefined;
  const subscribe = (_orderId: string, onStatus: (status: string) => void) => {
    handler = onStatus;
    return () => {
      handler = undefined;
    };
  };
  return { subscribe, push: (status: string) => handler?.(status) };
}

describe("srp/effects-cap", () => {
  it("Bad shows pushed status updates and syncs the document title", () => {
    const source = makeSubscribe();
    render(<BadStatus orderId="SO-771" subscribe={source.subscribe} />);
    expect(screen.getByText("Status: pending")).toBeDefined();
    act(() => source.push("shipped"));
    expect(screen.getByText("Status: shipped")).toBeDefined();
    expect(document.title).toBe("Order SO-771: shipped");
  });

  it("Good shows pushed status updates", () => {
    const source = makeSubscribe();
    render(<GoodStatus orderId="SO-771" subscribe={source.subscribe} />);
    act(() => source.push("delivered"));
    expect(screen.getByText("Status: delivered")).toBeDefined();
  });
});
