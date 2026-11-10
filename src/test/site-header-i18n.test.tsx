import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site/SiteHeader";
import { I18nProvider } from "@/lib/i18n/context";

function renderHeader(withProvider: boolean) {
  const rootRoute = createRootRoute({
    component: () => (withProvider ? <I18nProvider lang="en"><SiteHeader /></I18nProvider> : <SiteHeader />),
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("SiteHeader language binding", () => {
  it("renders English menu links when no I18nProvider is above it", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    renderHeader(false);
    expect(await screen.findByRole("banner")).toBeTruthy();
    expect(screen.getAllByText("Tools").length).toBeGreaterThan(0);
  });

  it("renders the same menu links inside I18nProvider", async () => {
    renderHeader(true);
    expect(await screen.findByRole("banner")).toBeTruthy();
    expect(screen.getAllByText("Tools").length).toBeGreaterThan(0);
  });
});
