import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InlineAlert } from "./Good";

describe("composition/config-soup good twin", () => {
  it("Good renders the alert and dismisses", () => {
    const onDismiss = vi.fn();
    render(
      <InlineAlert message="Coupon applied" dismissible={true} onDismiss={onDismiss} />,
    );
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
