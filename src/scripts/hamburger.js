function setupHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("nav");
  const navLinks = document.querySelector(".nav-links");

  if (!hamburger || !nav || !navLinks) return;

  // Store event listeners so we can remove them later
  const toggleMenu = () => {
    nav.classList.toggle("menu-open");
    navLinks.classList.toggle("active");
  };

  const closeMenuOutside = (e) => {
    if (!nav.contains(e.target) && nav.classList.contains("menu-open")) {
      nav.classList.remove("menu-open");
      navLinks.classList.remove("active");
    }
  };

  const closeMenu = () => {
    nav.classList.remove("menu-open");
    navLinks.classList.remove("active");
  };

  // Add event listeners
  hamburger.addEventListener("click", toggleMenu);
  document.addEventListener("click", closeMenuOutside);
  for (const link of navLinks.querySelectorAll("a")) {
    link.addEventListener("click", closeMenu);
  }

  // Cleanup function
  return () => {
    hamburger.removeEventListener("click", toggleMenu);
    document.removeEventListener("click", closeMenuOutside);
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
