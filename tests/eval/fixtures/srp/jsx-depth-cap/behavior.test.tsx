import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamDirectory as BadDirectory } from "./Bad";

const members = [
  { id: "u-1", name: "Sanne Bakker", role: "Support lead" },
  { id: "u-2", name: "Tom Jansen", role: "Warehouse" },
];

describe("srp/jsx-depth-cap", () => {
  it("Bad lists members with a summary", () => {
    render(<BadDirectory members={members} />);
    expect(screen.getByText("Sanne Bakker")).toBeDefined();
    expect(
      within(screen.getByLabelText("Roles present")).getByText("Warehouse"),
    ).toBeDefined();
    expect(screen.getByText("2 people · 2 roles")).toBeDefined();
  });

  it("Bad filters by name and shows the empty state", () => {
    render(<BadDirectory members={members} />);
    fireEvent.change(screen.getByLabelText("Filter members"), {
      target: { value: "sanne" },
    });
    expect(screen.getByText("1 people · 1 roles")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Filter members"), {
      target: { value: "zz" },
    });
    expect(screen.getByText("Nobody matches “zz”")).toBeDefined();
  });
});
