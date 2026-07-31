import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamDirectory as GoodDirectory } from "./Good";

const members = [
  { id: "u-1", name: "Sanne Bakker", role: "Support lead" },
  { id: "u-2", name: "Tom Jansen", role: "Warehouse" },
];

describe("srp/jsx-depth-cap good twin", () => {
  it("Good lists and filters identically", () => {
    render(<GoodDirectory members={members} />);
    expect(screen.getByText("2 people · 2 roles")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Filter members"), {
      target: { value: "tom" },
    });
    expect(screen.getByText("Tom Jansen")).toBeDefined();
    expect(screen.getByText("1 people · 1 roles")).toBeDefined();
  });
});
