document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector("nav");
  const navLinks = document.querySelector(".nav-links");

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("menu-open");
    navLinks.classList.toggle("active");
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!nav.contains(e.target) && nav.classList.contains("menu-open")) {
      nav.classList.remove("menu-open");
      navLinks.classList.remove("active");
    }
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("menu-open");
      navLinks.classList.remove("active");
    });
  });
});
