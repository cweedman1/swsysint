// site.js — shared site behaviors (safe for GitHub Pages)
(function () {
  "use strict";

  // Fade-in animation
  const faders = document.querySelectorAll(".fade-in");
  if (faders.length) {
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
  }

  // AJAX form submit + Turnstile reset
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("contactStatus");

    if (!form || !status) return;

    function showStatus(msg) {
      status.style.display = "block";
      status.textContent = msg;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showStatus("Sending…");

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Request failed");
        }

        form.reset();

        // Reset Turnstile widget
        if (window.turnstile) {
          try {
            window.turnstile.reset(); // for public site Turnstile
          } catch (_) {}
        }

        showStatus("✅ Message sent. We’ll get back to you shortly.");
      } catch (err) {
        showStatus("⚠️ Something went wrong. Please try again, or email/call us directly.");
      }
    });
  });
})();
