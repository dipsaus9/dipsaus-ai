import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { CatalogFilters, resetUiStore } from "./Bad";

describe("state/global-discipline", () => {
  beforeEach(() => {
    act(() => resetUiStore());
  });

  it("Bad toggles the filter panel through the global store", () => {
    render(<CatalogFilters facets={["material", "colour"]} />);
    expect(screen.queryByText("material")).toBeNull();
    fireEvent.click(screen.getByText("Show filters"));
    expect(screen.getByText("material")).toBeDefined();
    fireEvent.click(screen.getByText("Hide filters"));
    expect(screen.queryByText("material")).toBeNull();
  });
});
