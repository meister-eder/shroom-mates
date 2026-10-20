/* Blocking head script (external because of the CSP). Keeps the header marquee
   running seamlessly across page loads and marks pages arriving through a view
   transition so scroll-reveals do not animate on top of the page fade-in.
   The page transition grows from the new page's active menu item (or the logo),
   set as --vt-x / --vt-y (see base.css). Nothing is stored in the browser. */
(() => {
  const root = document.documentElement;
  const fallbackMs = 40000;
  let ms = fallbackMs;
  const raw = getComputedStyle(root)
    .getPropertyValue("--ticker-duration")
    .trim();
  if (raw.endsWith("ms")) ms = Number.parseFloat(raw) || fallbackMs;
  else if (raw.endsWith("s")) ms = (Number.parseFloat(raw) || 40) * 1000;
  root.style.setProperty("--ticker-delay", `-${Date.now() % ms}ms`);

  addEventListener("pagereveal", (event) => {
    const transition = event.viewTransition;
    if (!transition) return;
    const header = document.querySelector(".site-header");
    // first visible match (the mobile menu repeats the links, hidden when closed)
    const visible = (selector) => {
      for (const el of header?.querySelectorAll(selector) ?? []) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) return r;
      }
      return null;
    };
    const r = visible('[aria-current="page"]') || visible('a[href="/"]');
    if (r) {
      root.style.setProperty("--vt-x", `${Math.round(r.left + r.width / 2)}px`);
      root.style.setProperty("--vt-y", `${Math.round(r.top + r.height / 2)}px`);
    }
    root.dataset.vtArrive = "";
    transition.finished.finally(() => {
      delete root.dataset.vtArrive;
    });
  });
})();
