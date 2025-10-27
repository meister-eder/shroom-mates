function setupHamburgerMenu() {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("nav");
  const navLinks = document.querySelector(".nav-links");

  if (!hamburger || !nav || !navLinks) {
    console.log("Hamburger menu elements not found");
    return null;
  }

  console.log("Setting up hamburger menu");

  const toggleMenu = (e) => {
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

  const links = navLinks.querySelectorAll("a");
  for (const link of links) {
    link.addEventListener("click", closeMenu);
  }

  // Cleanup function
  return () => {
    hamburger.removeEventListener("click", toggleMenu);
    document.removeEventListener("click", closeMenuOutside);
    document.removeEventListener("keydown", handleKeydown);
    for (const link of links) {
      link.removeEventListener("click", closeMenu);
    }
  };
}

// Global cleanup reference
window.hamburgerCleanup = null;

// Clean up old listeners before setting up new ones
document.addEventListener("astro:before-preparation", () => {
  if (window.hamburgerCleanup) {
    window.hamburgerCleanup();
    window.hamburgerCleanup = null;
  }
});

// Setup on initial load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.hamburgerCleanup = setupHamburgerMenu();
  });
} else {
  // DOM already loaded
  window.hamburgerCleanup = setupHamburgerMenu();
}

// Setup after each Astro page load
document.addEventListener("astro:page-load", () => {
  if (window.hamburgerCleanup) {
    window.hamburgerCleanup();
  }
  window.hamburgerCleanup = setupHamburgerMenu();
});
