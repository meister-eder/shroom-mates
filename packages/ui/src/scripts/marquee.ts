/**
 * Marquee pause of <SiteHeader> (WCAG 2.2.2).
 * Hover and keyboard focus pause via CSS; a tap/click anywhere on the bar toggles
 * `data-paused`, the discreet button mirrors it with aria-pressed and its label.
 */
function setupMarquee(): void {
  const bar = document.querySelector<HTMLElement>(".site-header .ticker");
  const button = bar?.querySelector<HTMLButtonElement>(".ticker__toggle");
  if (!bar || !button) {
    return;
  }

  bar.addEventListener("click", () => {
    const paused = bar.dataset.paused !== "true";
    bar.dataset.paused = String(paused);
    button.setAttribute("aria-pressed", String(paused));
    button.setAttribute(
      "aria-label",
      (paused ? button.dataset.labelPlay : button.dataset.labelPause) ?? "",
    );
  });
}

setupMarquee();
