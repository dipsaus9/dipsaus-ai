import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupportPage } from "./Bad";

describe("state/colocate", () => {
  it("Bad sends the typed message", () => {
    const onSend = vi.fn();
    render(<SupportPage onSend={onSend} />);
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "My order arrived damaged" },
    });
    fireEvent.click(screen.getByText("Send"));
    expect(onSend).toHaveBeenCalledWith("My order arrived damaged");
  });
});
