import { renderSiteFooter, renderSiteHeader } from "./ui-components.js";
import {
  getCurrentUser,
  getSiteData,
  getStoredTheme,
  logoutCurrentUser,
  setStoredTheme,
} from "./storage.js";

let revealObserver;
const protectedPages = new Set(["translator", "practice", "courses", "profile"]);

function ensureToastContainer() {
  if (!document.querySelector("[data-toast-region]")) {
    const toastRegion = document.createElement("div");
    toastRegion.className = "toast-region";
    toastRegion.setAttribute("data-toast-region", "true");
    document.body.appendChild(toastRegion);
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function initThemeToggle() {
  applyTheme(getStoredTheme());

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      applyTheme(nextTheme);
      setStoredTheme(nextTheme);
    });
  });
}

function initMobileNav() {
  const toggle = document.querySelector("[data-mobile-nav-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");

  if (!toggle || !navPanel) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = navPanel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function initLogoutAction() {
  document.querySelectorAll("[data-user-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      logoutCurrentUser();
      window.location.reload();
    });
  });
}

function enforcePageAccess(pageId) {
  if (!protectedPages.has(pageId)) {
    return true;
  }

  if (getCurrentUser()) {
    return true;
  }

  const currentFile = window.location.pathname.split("/").pop() || `${pageId}.html`;
  window.location.replace(`login.html?next=${encodeURIComponent(currentFile)}`);
  return false;
}

function updateDocumentTitle(pageId) {
  const siteData = getSiteData();
  const pageLabels = {
    home: "Speak Natural English with Hindi Support",
    features: "Premium Features",
    translator: "Hindi to Spoken English Translator",
    practice: "Daily Practice",
    courses: "Courses",
    profile: "Learner Profile",
    login: "Login",
    signup: "Create Account",
    admin: "Admin Dashboard",
  };

  const label = pageLabels[pageId] || "Spoken English Learning";
  document.title = `${label} | ${siteData.brand.name}`;
}

export function refreshShell() {
  const pageId = document.body.dataset.page || "home";
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");

  updateDocumentTitle(pageId);

  if (headerMount) {
    headerMount.innerHTML = renderSiteHeader(pageId);
  }

  if (footerMount) {
    footerMount.innerHTML = renderSiteFooter();
  }

  initThemeToggle();
  initMobileNav();
  initLogoutAction();
}

export function refreshReveal() {
  if (revealObserver) {
    revealObserver.disconnect();
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    revealObserver.observe(element);
  });
}

export function showToast(message, tone = "success") {
  ensureToastContainer();
  const toastRegion = document.querySelector("[data-toast-region]");
  const toast = document.createElement("div");
  toast.className = `toast toast-${tone}`;
  toast.textContent = message;
  toastRegion.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureToastContainer();
  const pageId = document.body.dataset.page || "home";
  if (!enforcePageAccess(pageId)) {
    return;
  }
  refreshShell();
});
