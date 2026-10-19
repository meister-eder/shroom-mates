/**
 * Mobile menu of <SiteHeader>: a full-screen overlay on ink.
 * Hooks: header.site-header > nav.site-nav > button.hamburger + ul.nav-links.
 *
 * - aria-expanded / aria-label on the button
 * - Escape closes and returns focus to the button
 * - Tab is trapped inside the header while the overlay is open
 * - page scroll is locked (html.menu-locked)
 * - closes on link click and when the viewport grows to desktop
 */
const DESKTOP = "(min-width: 1241px)" /* keep in sync with SiteHeader.astro */;
const LABEL_OPEN = "Navigationsmenü öffnen";
const LABEL_CLOSE = "Navigationsmenü schließen";

function setupHamburgerMenu(): (() => void) | null {
  const header = document.querySelector<HTMLElement>(".site-header");
  const hamburger = header?.querySelector<HTMLButtonElement>(".hamburger");
  const nav = header?.querySelector<HTMLElement>(".site-nav");
  const navLinks = header?.querySelector<HTMLElement>(".nav-links");

  if (!header || !hamburger || !nav || !navLinks) {
    return null;
  }

  const isOpen = () => nav.classList.contains("menu-open");

  const setOpen = (open: boolean) => {
    nav.classList.toggle("menu-open", open);
    navLinks.classList.toggle("active", open);
    document.documentElement.classList.toggle("menu-locked", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? LABEL_CLOSE : LABEL_OPEN);
  };

  const toggleMenu = () => {
    const open = !isOpen();
    setOpen(open);
    if (open) navLinks.querySelector<HTMLElement>("a")?.focus();
  };

  const closeMenu = () => setOpen(false);

  const handleKeydown = (e: KeyboardEvent) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      closeMenu();
      hamburger.focus();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = Array.from(
      header.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ).filter((el) => el.offsetParent !== null || el === hamburger);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const mq = window.matchMedia(DESKTOP);
  const onViewport = () => {
    if (mq.matches) closeMenu();
  };

  setOpen(false);
  hamburger.addEventListener("click", toggleMenu);
  document.addEventListener("keydown", handleKeydown);
  mq.addEventListener("change", onViewport);

  const links = navLinks.querySelectorAll("a");
  for (const link of links) {
    link.addEventListener("click", closeMenu);
  }

  return () => {
    closeMenu();
    hamburger.removeEventListener("click", toggleMenu);
    document.removeEventListener("keydown", handleKeydown);
    mq.removeEventListener("change", onViewport);
    for (const link of links) {
      link.removeEventListener("click", closeMenu);
    }
  };
}

setupHamburgerMenu();
