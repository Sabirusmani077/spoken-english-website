import { getCurrentUser, getSiteData } from "./storage.js";

const navItems = [
  { id: "home", label: "Home", href: "index.html" },
  { id: "features", label: "Features", href: "features.html" },
  { id: "translator", label: "Translator", href: "translator.html", protected: true },
  { id: "practice", label: "Practice", href: "practice.html", protected: true },
  { id: "courses", label: "Courses", href: "courses.html", protected: true },
];

function getProtectedHref(href, currentUser) {
  return currentUser ? href : `login.html?next=${encodeURIComponent(href)}`;
}

function renderBrandName(siteData) {
  if (siteData.brand.name.toLowerCase() === "english with mr sabir") {
    return `
      <strong class="brand-mark__name">
        <span class="brand-mark__name-main">english</span>
        <span class="brand-mark__name-sep">with</span>
        <span class="brand-mark__name-accent">mr sabir</span>
      </strong>
    `;
  }

  return `<strong>${siteData.brand.name}</strong>`;
}

function getUserInitials(fullName) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "U";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function renderUserAvatar(currentUser, className = "user-avatar") {
  if (currentUser?.avatarDataUrl) {
    return `<span class="${className}"><img src="${currentUser.avatarDataUrl}" alt="${currentUser.fullName}" /></span>`;
  }

  return `<span class="${className} user-avatar--fallback">${getUserInitials(currentUser?.fullName)}</span>`;
}

function renderHeaderProfileShortcut(currentUser) {
  if (!currentUser) {
    return "";
  }

  return `
    <a class="header-profile-shortcut" href="profile.html" aria-label="Open learner profile">
      ${renderUserAvatar(currentUser, "header-profile-shortcut__avatar")}
    </a>
  `;
}

function iconMarkup(name) {
  const icons = {
    arrow:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    menu:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/></svg>',
    sun:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4V2m0 20v-2m8-8h2M2 12h2m13.7 5.7 1.4 1.4M4.9 4.9l1.4 1.4m11.4-1.4-1.4 1.4M6.3 17.7l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    moon:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 14.5A8.5 8.5 0 1 1 9.5 3.6a7 7 0 0 0 10.9 10.9Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    translate:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h10M9 5c0 7-3.5 11-6 13m6-8H5m10 2 5 7m-1.5-3h-7m4.5-11 1.5 4 1.5-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    practice:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9 16l10-10M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    conversation:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18V6h14v9H8l-3 3Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    grammar:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    library:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h4v14H5zm5 0h4v14h-4zm5 0h4v14h-4z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    beginner:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14m0-14 6 3v8l-6 3-6-3V8z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    mobile:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 15h2" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    insight:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a7 7 0 0 1 4 12.7V19H8v-3.3A7 7 0 0 1 12 3Zm-2 18h4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    youtube:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12s0-3.2-.4-4.7a2.8 2.8 0 0 0-2-2C17.1 5 12 5 12 5s-5.1 0-6.6.3a2.8 2.8 0 0 0-2 2C3 8.8 3 12 3 12s0 3.2.4 4.7a2.8 2.8 0 0 0 2 2C6.9 19 12 19 12 19s5.1 0 6.6-.3a2.8 2.8 0 0 0 2-2c.4-1.5.4-4.7.4-4.7ZM10 15.5v-7l6 3.5-6 3.5Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.6"/></svg>',
    instagram:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    facebook:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3.3l.7-4H13V9a1 1 0 0 1 1-1Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    telegram:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 4-3 15-5-4-3 2 1-5-5-2L20 4Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20a8 8 0 1 0-4.7-1.5L5 20l1.7-2.3A8 8 0 0 0 12 20Zm-2.8-9.7c.2-.5.5-.5.8-.5h.7c.2 0 .5 0 .6.4l.7 1.7c.1.2.1.5 0 .7l-.5.6c-.1.2-.2.3-.1.5.2.4.7 1.2 1.7 1.9 1.2.8 1.8.9 2.1 1 .2 0 .4 0 .5-.2l.8-.9c.2-.2.4-.2.6-.1l1.5.7c.3.1.5.3.4.6l-.3 1.1c-.1.4-.7.7-1.2.7a6.3 6.3 0 0 1-3.1-.8A8.8 8.8 0 0 1 9.1 14a5.2 5.2 0 0 1-.8-2.4c0-.5.3-.9.9-1.3Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/></svg>',
    linkedin:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9v9M7 6.5v.1M11 18V9h4a3 3 0 0 1 3 3v6M4 18h6M4 9h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
  };

  return icons[name] || icons.arrow;
}

export function getIcon(name) {
  return iconMarkup(name);
}

function renderActionButtons(pageId, currentUser) {
  const actionLinks = [
    { id: "login", label: "Login", href: "login.html", style: "ghost" },
    { id: "signup", label: "Create Account", href: "signup.html", style: "solid" },
    { id: "admin", label: "Admin", href: "admin.html", style: "subtle" },
  ];

  return `
    <div class="nav-actions">
      <button class="theme-toggle" type="button" aria-label="Toggle color theme" data-theme-toggle>
        <span class="icon icon-sun">${iconMarkup("sun")}</span>
        <span class="icon icon-moon">${iconMarkup("moon")}</span>
      </button>
      ${
        currentUser
          ? `<button class="button button-ghost button-small" type="button" data-user-logout>Logout</button>`
          : actionLinks
              .map(
                (item) => `
                <a class="button button-${item.style} button-small ${
                  pageId === item.id ? "is-active" : ""
                }" href="${item.href}">
                  ${item.label}
                </a>`
              )
              .join("")
      }
    </div>
  `;
}

export function renderSiteHeader(pageId) {
  const siteData = getSiteData();
  const currentUser = getCurrentUser();

  return `
    <div class="nav-shell">
      <a class="brand-mark" href="index.html" aria-label="${siteData.brand.name} home">
        <span class="brand-mark__logo">
          <img src="${siteData.brand.photoUrl}" alt="Mr Sabir" />
        </span>
        <span class="brand-mark__text">
          ${renderBrandName(siteData)}
          <small>${siteData.brand.tagline}</small>
        </span>
      </a>
      <div class="nav-panel" data-nav-panel>
        <nav class="main-nav" aria-label="Primary">
          ${navItems
            .map(
              (item) => `
                <a class="main-nav__link ${pageId === item.id ? "is-active" : ""} ${
                  item.protected && !currentUser ? "is-locked" : ""
                }" href="${item.protected ? getProtectedHref(item.href, currentUser) : item.href}">
                  ${item.label}
                  ${item.protected && !currentUser ? '<span class="nav-lock">Login</span>' : ""}
                </a>
              `
            )
            .join("")}
        </nav>
        ${renderActionButtons(pageId, currentUser)}
      </div>
      ${renderHeaderProfileShortcut(currentUser)}
      <button class="mobile-nav-toggle" type="button" aria-expanded="false" aria-label="Open navigation" data-mobile-nav-toggle>
        ${iconMarkup("menu")}
      </button>
    </div>
  `;
}

export function renderSiteFooter() {
  const siteData = getSiteData();
  const currentUser = getCurrentUser();
  const ownerName = siteData.brand.ownerName || "Sabir";
  const contactPhone = siteData.brand.contactPhone || "9458204216";
  const quickLinks = [
    { label: "Home", href: "index.html" },
    { label: "Features", href: "features.html" },
    { label: "Translator", href: "translator.html", protected: true },
    { label: "Practice", href: "practice.html", protected: true },
    { label: "Courses", href: "courses.html", protected: true },
  ];
  const footerFeatureLinks = [
    { label: "Spoken English Translator", href: "features.html" },
    { label: "Daily Practice Sentences", href: "features.html" },
    { label: "Real-Life Conversations", href: "features.html" },
    { label: "Grammar Support for Speaking", href: "features.html" },
  ];
  const socialLinks = Object.entries(siteData.socialLinks);
  const contactDetails = [
    { label: "Website Owner", value: ownerName },
    {
      label: "Email Address",
      value: siteData.brand.contactEmail,
      href: `mailto:${siteData.brand.contactEmail}`,
    },
    {
      label: "Mobile Number",
      value: contactPhone,
      href: `tel:${contactPhone}`,
    },
  ];

  return `
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand-mark brand-mark--footer" href="index.html" aria-label="${siteData.brand.name} home">
          <span class="brand-mark__logo">
            <img src="${siteData.brand.photoUrl}" alt="Mr Sabir" />
          </span>
          <span class="brand-mark__text">
            ${renderBrandName(siteData)}
            <small>${siteData.brand.tagline}</small>
          </span>
        </a>
        <p class="footer-brand__lead">${siteData.brand.about}</p>
        <div class="footer-owner-badge">
          <span>Website Owner</span>
          <strong>${ownerName}</strong>
        </div>
      </div>
      <div class="footer-panel">
        <h3>Quick Links</h3>
        <ul class="footer-links">
          ${quickLinks
            .map(
              (item) =>
                `<li><a href="${
                  item.protected ? getProtectedHref(item.href, currentUser) : item.href
                }">${item.label}</a></li>`
            )
            .join("")}
        </ul>
      </div>
      <div class="footer-panel">
        <h3>Feature Focus</h3>
        <ul class="footer-links">
          ${footerFeatureLinks
            .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
            .join("")}
        </ul>
      </div>
      <div class="footer-panel">
        <h3>Get in Touch</h3>
        <ul class="footer-contact-list">
          ${contactDetails
            .map(
              (item) => `
                <li class="footer-contact-item">
                  <span>${item.label}</span>
                  ${
                    item.href
                      ? `<a class="footer-mail" href="${item.href}">${item.value}</a>`
                      : `<strong>${item.value}</strong>`
                  }
                </li>
              `
            )
            .join("")}
        </ul>
        <p class="footer-note">For classes, collaboration, feedback, or learning support, feel free to get in touch.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="social-links" aria-label="Social media links">
        ${socialLinks
          .map(
            ([platform, url]) => `
            <a href="${url}" target="_blank" rel="noreferrer" aria-label="${platform}">
              ${iconMarkup(platform)}
            </a>
          `
          )
          .join("")}
      </div>
      <div class="footer-meta">
        <span>&copy; ${new Date().getFullYear()} ${siteData.brand.name}. Owned and managed by ${ownerName}.</span>
        <div class="footer-legal">
          <a href="index.html#terms">Terms</a>
          <a href="index.html#privacy">Privacy</a>
          <a href="index.html#contact">Contact</a>
        </div>
      </div>
    </div>
  `;
}
