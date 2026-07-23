import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleCard } from "./Bad";
import { ArticleByline } from "./Good";

describe("composition/regions-as-slots", () => {
  it("Bad renders every configured region and fires the action", () => {
    const onCta = vi.fn();
    render(
      <ArticleCard
        kicker="Guides"
        title="Choosing a standing desk"
        body="Height range matters more than motor speed."
        footerNote="Updated July 2026"
        ctaLabel="Read guide"
        onCta={onCta}
      />,
    );
    expect(screen.getByText("Choosing a standing desk")).toBeDefined();
    expect(screen.getByText("Updated July 2026")).toBeDefined();
    fireEvent.click(screen.getByText("Read guide"));
    expect(onCta).toHaveBeenCalledOnce();
  });

  it("Good renders the byline", () => {
    render(
      <ArticleByline author="Sanne Bakker" publishedAt="2026-07-12" readMinutes={6} />,
    );
    expect(
      screen.getByText("By Sanne Bakker · 2026-07-12 · 6 min read"),
    ).toBeDefined();
  });
});
