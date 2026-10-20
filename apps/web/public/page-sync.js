/* Blocking head script (external because of the CSP). Keeps the header marquee
   running seamlessly across page loads and marks pages arriving through a view
   transition so scroll-reveals do not animate on top of the page fade-in. */
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
    root.dataset.vtArrive = "";
    transition.finished.finally(() => {
      delete root.dataset.vtArrive;
    });
  });
})();
