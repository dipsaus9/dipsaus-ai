import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TeamDirectory as BadDirectory } from "./Bad";
import { TeamDirectory as GoodDirectory } from "./Good";

const members = [
  { id: "u-1", name: "Sanne Bakker", role: "Support lead" },
  { id: "u-2", name: "Tom Jansen", role: "Warehouse" },
];

describe("srp/jsx-depth-cap", () => {
  it("Bad lists members with roles", () => {
    render(<BadDirectory members={members} />);
    expect(screen.getByText("Sanne Bakker")).toBeDefined();
    expect(screen.getByText("Warehouse")).toBeDefined();
  });

  it("Good lists members with roles", () => {
    render(<GoodDirectory members={members} />);
    expect(screen.getByText("Sanne Bakker")).toBeDefined();
    expect(screen.getByText("Warehouse")).toBeDefined();
  });
});
