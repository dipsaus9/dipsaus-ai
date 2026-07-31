import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

describe("srp/effects-cap good twin", () => {
  it("Good shows pushed status updates", () => {
    const source = makeSubscribe();
    render(<GoodStatus orderId="SO-771" subscribe={source.subscribe} />);
    act(() => source.push("delivered"));
    expect(screen.getByText("Status: delivered")).toBeDefined();
  });
});
