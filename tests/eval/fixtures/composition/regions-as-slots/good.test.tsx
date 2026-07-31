import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleByline } from "./Good";

describe("composition/regions-as-slots good twin", () => {
  it("Good renders the byline", () => {
    render(
      <ArticleByline author="Sanne Bakker" publishedAt="2026-07-12" readMinutes={6} />,
    );
    expect(
      screen.getByText("By Sanne Bakker · 2026-07-12 · 6 min read"),
    ).toBeDefined();
  });
});
