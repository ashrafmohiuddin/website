(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  // Mobile nav
  const menuBtn = document.getElementById("menuBtn");
  const nav = document.getElementById("nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", nav.classList.contains("open") ? "true" : "false");
    });
  }

  // Scroll progress
  const progress = document.querySelector(".scroll-progress");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${pct}%`;
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // Reveal on scroll
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      reveals.forEach((el) => io.observe(el));
    }
  }

  // Count-up stats
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const animateCount = (el) => {
      const target = Number(el.dataset.count || 0);
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = Math.round(target * eased);
        el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
        if (t < 1) requestAnimationFrame(tick);
      };

      if (reduceMotion) {
        el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      } else {
        requestAnimationFrame(tick);
      }
    };

    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  // Magnetic buttons
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  // Custom cursor
  if (finePointer && !reduceMotion) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.append(dot, ring);
    document.body.classList.add("has-cursor");

    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = `${mx}px`;
        dot.style.top = `${my}px`;
      },
      { passive: true }
    );

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    document.querySelectorAll("a, button, .portal, .trip-card, .method, .work-item").forEach((el) => {
      el.addEventListener("mouseenter", () => document.body.classList.add("cursor-hover"));
      el.addEventListener("mouseleave", () => document.body.classList.remove("cursor-hover"));
    });
  }

  // Coffee methods
  const methods = document.querySelectorAll(".method");
  const detail = document.getElementById("methodDetail");
  if (methods.length && detail) {
    methods.forEach((method) => {
      method.addEventListener("click", () => {
        methods.forEach((m) => m.classList.remove("active"));
        method.classList.add("active");
        detail.textContent = method.dataset.detail || "";
      });
    });
    methods[0].click();
  }

  // Contact form mailto fallback (real send without backend)
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector("[name=name]")?.value?.trim() || "";
      const email = form.querySelector("[name=email]")?.value?.trim() || "";
      const subject = form.querySelector("[name=subject]")?.value?.trim() || "Hello from sashraf.in";
      const message = form.querySelector("[name=message]")?.value?.trim() || "";
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:ashraf61242@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    });
  }

  // Keyboard trip rail nudge
  document.querySelectorAll(".trip-rail").forEach((rail) => {
    rail.setAttribute("tabindex", "0");
    rail.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") rail.scrollBy({ left: 320, behavior: "smooth" });
      if (e.key === "ArrowLeft") rail.scrollBy({ left: -320, behavior: "smooth" });
    });
  });
})();
