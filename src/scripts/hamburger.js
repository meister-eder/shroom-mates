document.querySelector(".hamburger").addEventListener("click", () => {
  const nav = document.querySelector("nav");
  const navLinks = document.querySelector(".nav-links");
  nav.classList.toggle("menu-open");
  navLinks.classList.toggle("active");
});
