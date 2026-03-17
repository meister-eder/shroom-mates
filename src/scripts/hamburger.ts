let cleanupFn: (() => void) | null = null;

function setupHamburgerMenu(): (() => void) | null {
  const hamburger = document.querySelector<HTMLButtonElement>(".hamburger");
  const nav = document.querySelector<HTMLElement>("nav");
  const navLinks = document.querySelector<HTMLElement>(".nav-links");

  if (!hamburger || !nav || !navLinks) {
    return null;
  }

  const toggleMenu = (e: Event) => {
    e.stopPropagation();
    const isOpen = nav.classList.contains("menu-open");

    if (isOpen) {
      nav.classList.remove("menu-open");
      navLinks.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.setAttribute("aria-label", "Navigationsmenü öffnen");
    } else {
      nav.classList.add("menu-open");
      navLinks.classList.add("active");
      hamburger.setAttribute("aria-expanded", "true");
      hamburger.setAttribute("aria-label", "Navigationsmenü schließen");
    }
  };

  const closeMenu = () => {
    nav.classList.remove("menu-open");
    navLinks.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Navigationsmenü öffnen");
  };

  const closeMenuOutside = (e: MouseEvent) => {
    if (!nav.contains(e.target as Node) && nav.classList.contains("menu-open")) {
      closeMenu();
    }
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && nav.classList.contains("menu-open")) {
      closeMenu();
      hamburger.focus();
    }
  };

  hamburger.addEventListener("click", toggleMenu);
  document.addEventListener("click", closeMenuOutside);
  document.addEventListener("keydown", handleKeydown);

  const links = navLinks.querySelectorAll("a");
  for (const link of links) {
    link.addEventListener("click", closeMenu);
  }

  return () => {
    hamburger.removeEventListener("click", toggleMenu);
    document.removeEventListener("click", closeMenuOutside);
    document.removeEventListener("keydown", handleKeydown);
    for (const link of links) {
      link.removeEventListener("click", closeMenu);
    }
  };
}

document.addEventListener("astro:before-preparation", () => {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    cleanupFn = setupHamburgerMenu();
  });
} else {
  cleanupFn = setupHamburgerMenu();
}

document.addEventListener("astro:page-load", () => {
  if (cleanupFn) {
    cleanupFn();
  }
  cleanupFn = setupHamburgerMenu();
});
