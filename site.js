// site.js — shared site behaviors (safe for static hosting)
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

  function showStatus(el, msg) {
    if (!el) return;
    el.style.display = "block";
    el.textContent = msg;
  }

  function resetTurnstileIfPossible() {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      try { window.turnstile.reset(); } catch (_) {}
    }
  }

  // Catalog lightbox (works for any page that includes the markup)
  function wireLightbox() {
    const lb = document.getElementById("lightbox");
    const img = document.getElementById("lightboxImg");
    if (!lb || !img) return;

    const closeBtn = lb.querySelector(".lightbox-close");
    if (!closeBtn) return;

    function openLightbox(src) {
      img.src = src;
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function closeLightbox() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      img.src = "";
      document.body.style.overflow = "";
    }

    document.querySelectorAll('a[data-lightbox="1"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const href = a.getAttribute("href");
        if (href) openLightbox(href);
      });
    });

    closeBtn.addEventListener("click", closeLightbox);

    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lb.classList.contains("open")) closeLightbox();
    });
  }

  // Generic AJAX submit handler for Formspree + Turnstile
  async function wireAjaxForm({ formId, statusId, buttonId }) {
    const form = document.getElementById(formId);
    const status = document.getElementById(statusId);
    const btn = buttonId ? document.getElementById(buttonId) : null;

    if (!form || !status) return;

    // If this form includes Turnstile, keep submit disabled until solved
    const hasTurnstile = !!form.querySelector(".cf-turnstile");
    if (btn && hasTurnstile) btn.disabled = true;

    // Turnstile callbacks (global)
    window.onTurnstileOk = function () {
      if (btn) btn.disabled = false;
      if (status) status.style.display = "none";
    };
    window.onTurnstileExpired = function () {
      if (btn) btn.disabled = true;
      showStatus(status, "⚠️ Verification expired. Please try again.");
    };
    window.onTurnstileError = function () {
      if (btn) btn.disabled = true;
      showStatus(status, "⚠️ Verification failed to load. Disable blockers or refresh.");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      showStatus(status, "Sending…");

      // Turnstile token guard (only if widget exists)
      if (hasTurnstile) {
        const token = form.querySelector('input[name="cf-turnstile-response"]');
        if (!token || !token.value) {
          if (btn) btn.disabled = true;
          showStatus(status, "⚠️ Please complete the verification.");
          return;
        }
      }

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
        resetTurnstileIfPossible();

        // If Turnstile is used, lock button again until new token
        if (btn && hasTurnstile) btn.disabled = true;

        showStatus(status, "✅ Message sent. We’ll get back to you shortly.");
      } catch (err) {
        // Fallback attempt: let browser try a normal submit (if CSP blocks fetch)
        showStatus(status, "⚠️ Submit failed. Trying standard submit…");
        try { form.submit(); } catch (_) {
          showStatus(status, "❌ Error submitting the form. Please email/call us directly.");
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Contact page
    wireAjaxForm({
      formId: "contactForm",
      statusId: "contactStatus",
      buttonId: null
    });

    // Catalog part pages
    wireAjaxForm({
      formId: "quoteForm",
      statusId: "quoteStatus",
      buttonId: "quoteBtn"
    });

    // Catalog lightbox
    wireLightbox();
  });
})();
