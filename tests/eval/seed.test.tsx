import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Bad } from "./fixtures/seed/Bad";
import { Good } from "./fixtures/seed/Good";

// Proves the island works end to end: tsx compiles under tests/eval/tsconfig.json,
// react renders into jsdom, and testing-library queries the result.
describe("fixture island seed pair", () => {
  it("renders the Bad fixture", () => {
    render(<Bad first="Ada" last="Lovelace" />);
    expect(screen.getByText("Hello, Ada Lovelace")).toBeDefined();
  });

  it("renders the Good fixture", () => {
    render(<Good first="Ada" last="Lovelace" />);
    expect(screen.getByText("Hello, Ada Lovelace")).toBeDefined();
  });
});
