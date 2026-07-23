import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SupportPage } from "./Bad";
import { OrdersWorkspace } from "./Good";

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

  it("Good shares the selection between list and detail", () => {
    render(
      <OrdersWorkspace
        orders={[
          { id: "SO-1", total: 100 },
          { id: "SO-2", total: 60 },
        ]}
      />,
    );
    expect(screen.getByText("Select an order")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "SO-2" }));
    expect(screen.getByText("Total €60.00")).toBeDefined();
    expect(
      screen.getByRole("button", { name: "SO-2" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
