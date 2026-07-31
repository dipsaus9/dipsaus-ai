import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfileHeader as GoodHeader } from "./Good";

describe("srp/internal-state good twin", () => {
  it("Good receives the outstanding balance via props", () => {
    render(
      <GoodHeader displayName="Dennis" outstandingBalance={42.5} currency="€" />,
    );
    expect(screen.getByRole("status").textContent).toBe("Outstanding: €42.50");
  });
});
