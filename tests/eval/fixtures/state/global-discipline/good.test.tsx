import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { AccountMenuLabel, signIn } from "./Good";

describe("state/global-discipline good twin", () => {
  it("Good reflects the shared session", () => {
    render(<AccountMenuLabel />);
    act(() => signIn({ userName: "Dennis", locale: "nl" }));
    expect(screen.getByText("Dennis")).toBeDefined();
    expect(screen.getByText("Dennis").getAttribute("lang")).toBe("nl");
  });
});
