
(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navbar = document.querySelector(".navbar");

  if (!header || !navbar) return;

  const menuBtn = navbar.querySelector(".navbar__menu-toggle");
  const menu = navbar.querySelector(".navbar__links");
  const themeBtn = navbar.querySelector(".navbar__theme-toggle");


  //  Mobile menu
  const isMenuOpen = () =>
    menuBtn?.getAttribute("aria-expanded") === "true";

  const setMenu = (open, { restoreFocus = false } = {}) => {
    if (!menuBtn) return;

    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );

    if (!open && restoreFocus) {
      menuBtn.focus();
    }
  };

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
      setMenu(!isMenuOpen());
    });

    // Close with Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isMenuOpen()) {
        setMenu(false, { restoreFocus: true });
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (isMenuOpen() && !navbar.contains(e.target)) {
        setMenu(false);
      }
    });

    // Close after selecting a link
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        setMenu(false);
      }
    });

    // Close when switching to desktop
    const desktop = window.matchMedia("(min-width: 48.0625rem)");

    desktop.addEventListener("change", (e) => {
      if (e.matches) setMenu(false);
    });
  }


  //  Theme toggle: system -> light -> dark -> system
  const THEME_KEY = "theme";
  const MODES = ["system", "light", "dark"];

  const readMode = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return MODES.includes(saved) ? saved : "system";
    } catch {
      return "system";
    }
  };

  const saveMode = (mode) => {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Theme still works without localStorage
    }
  };

  const applyMode = (mode) => {
    if (!MODES.includes(mode)) mode = "system";

    root.dataset.theme = mode;

    if (themeBtn) {
      const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];

      themeBtn.dataset.mode = mode;
      themeBtn.setAttribute(
        "aria-label",
        `Theme: ${mode}. Switch to ${next}`
      );
      themeBtn.title = `Theme: ${mode}`;
    }
  };

  // Initialize theme
  applyMode(readMode());

  // Change theme with a single click
  if (themeBtn) {
    themeBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const current = readMode();
      const currentIndex = MODES.indexOf(current);
      const nextMode = MODES[(currentIndex + 1) % MODES.length];

      applyMode(nextMode);
      saveMode(nextMode);
    });
  }

  // Sync theme across tabs
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) {
      applyMode(readMode());
    }
  });


  const toast = document.getElementById("toast");
  const buttons = document.querySelectorAll("[data-copy]");
  if (!toast || !buttons.length) return;

  const TOAST_MS = 2200;
  let toastTimer;
  const resetTimers = new WeakMap();

  const showToast = (message) => {
    toast.textContent = message;
    toast.dataset.visible = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.dataset.visible = "false";
    }, TOAST_MS);
  };

  // Clipboard API needs https/localhost; fall back for other cases
  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    input.remove();
    if (!ok) throw new Error("Copy failed");
  };

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await copyText(button.dataset.copy);
        button.dataset.copied = "true";
        showToast("Email copied to clipboard");

        clearTimeout(resetTimers.get(button));
        resetTimers.set(
          button,
          setTimeout(() => {
            delete button.dataset.copied;
          }, TOAST_MS)
        );
      } catch {
        showToast("Couldn't copy. Please copy it manually.");
      }
    });
  });

})();
