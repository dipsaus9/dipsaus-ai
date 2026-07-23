import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { CatalogFilters, resetUiStore } from "./Bad";
import { AccountMenuLabel, signIn } from "./Good";

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

  it("Good reflects the shared session", () => {
    render(<AccountMenuLabel />);
    act(() => signIn({ userName: "Dennis", locale: "nl" }));
    expect(screen.getByText("Dennis")).toBeDefined();
    expect(screen.getByText("Dennis").getAttribute("lang")).toBe("nl");
  });
});
