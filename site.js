// site.js — shared site behaviors (safe for GitHub Pages)
(function () {
  "use strict";

  // Fade-in animation: elements with .fade-in become visible on scroll
  const faders = document.querySelectorAll(".fade-in");
  if (!faders.length) return;

  const appearOnScroll = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  faders.forEach((el) => appearOnScroll.observe(el));
})();
