function setupHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("nav");
  const navLinks = document.querySelector(".nav-links");

  if (!hamburger || !nav || !navLinks) return;

  // Store event listeners so we can remove them later
  const toggleMenu = () => {
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

  const closeMenuOutside = (e) => {
    if (!nav.contains(e.target) && nav.classList.contains("menu-open")) {
      closeMenu();
    }
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape" && nav.classList.contains("menu-open")) {
      closeMenu();
      hamburger.focus();
    }
  };

  // Add event listeners
  hamburger.addEventListener("click", toggleMenu);
  document.addEventListener("click", closeMenuOutside);
  document.addEventListener("keydown", handleKeydown);

  for (const link of navLinks.querySelectorAll("a")) {
    link.addEventListener("click", closeMenu);
  }

  // Cleanup function
  return () => {
    hamburger.removeEventListener("click", toggleMenu);
    document.removeEventListener("click", closeMenuOutside);
    document.removeEventListener("keydown", handleKeydown);
    for (const link of navLinks.querySelectorAll("a")) {
      link.removeEventListener("click", closeMenu);
    }
  };
}

let cleanup = null;

// Clean up old listeners before setting up new ones
document.addEventListener("astro:before-preparation", () => {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
});

// Setup on initial load and after each navigation
document.addEventListener("DOMContentLoaded", () => {
  if (cleanup) cleanup();
  cleanup = setupHamburgerMenu();
});

document.addEventListener("astro:page-load", () => {
  if (cleanup) cleanup();
  cleanup = setupHamburgerMenu();
});
