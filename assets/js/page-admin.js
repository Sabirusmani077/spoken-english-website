import { refreshReveal, refreshShell, showToast } from "./app.js";
import {
  getSiteData,
  getTranslatorSearches,
  getUsers,
  isAdminLoggedIn,
  saveSiteData,
  saveUsers,
  setAdminLoggedIn,
} from "./storage.js";

const ADMIN_CREDENTIAL_HASHES = {
  email: "956b1acacc804547d5158a31bae2f51720dd065ff0ef6f26884d1a96f637ce4c",
  password: "805dbee347f0f1f95598c9fd1a04d3e9263d10ad075ef9dd4cf5704f2257f3c3",
};

const collectionConfigs = [
  {
    key: "featureCards",
    title: "Manage Feature Cards",
    description: "Add, edit, or delete the premium feature cards shown across the site.",
    fields: [
      { name: "title", label: "Title" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "badge", label: "Badge" },
      { name: "icon", label: "Icon key" },
    ],
    columns: ["title", "badge", "icon"],
  },
  {
    key: "lessons",
    title: "Manage Lessons",
    description: "Control the course cards shown on the course page.",
    fields: [
      { name: "title", label: "Title" },
      { name: "description", label: "Short description", type: "textarea" },
      { name: "level", label: "Level" },
      { name: "duration", label: "Duration" },
      { name: "focus", label: "Focus" },
    ],
    columns: ["title", "level", "duration"],
  },
  {
    key: "phrases",
    title: "Manage Translator Phrases",
    description: "Add phrases used by the Hindi to spoken English translator.",
    fields: [
      { name: "hindi", label: "Hindi or Hinglish" },
      { name: "basicEnglish", label: "Basic English", type: "textarea" },
      { name: "naturalEnglish", label: "Natural spoken English", type: "textarea" },
      { name: "betterAlternative", label: "Better alternative", type: "textarea" },
      { name: "explanation", label: "Explanation", type: "textarea" },
      { name: "commonMistake", label: "Common mistake", type: "textarea" },
    ],
    columns: ["hindi", "naturalEnglish", "betterAlternative"],
  },
  {
    key: "testimonials",
    title: "Manage Testimonials",
    description: "Update social proof cards displayed on the home page.",
    fields: [
      { name: "name", label: "Learner name" },
      { name: "role", label: "Role" },
      { name: "quote", label: "Quote", type: "textarea" },
      { name: "rating", label: "Rating" },
    ],
    columns: ["name", "role", "rating"],
  },
];

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("page-root");

  function truncate(value) {
    return String(value || "").length > 72
      ? `${String(value).slice(0, 69)}...`
      : String(value || "");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateTime(value) {
    if (!value) {
      return "Not available";
    }

    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value));
    } catch (error) {
      return String(value);
    }
  }

  async function sha256(value) {
    const normalized = String(value || "");
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hashBuffer)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  async function isValidAdminLogin(email, password) {
    if (!window.crypto?.subtle) {
      return false;
    }

    const [emailHash, passwordHash] = await Promise.all([
      sha256(String(email || "").trim().toLowerCase()),
      sha256(String(password || "")),
    ]);

    return (
      emailHash === ADMIN_CREDENTIAL_HASHES.email &&
      passwordHash === ADMIN_CREDENTIAL_HASHES.password
    );
  }

  function renderUsersSection(users) {
    const levelCounts = users.reduce(
      (summary, user) => {
        const level = String(user.level || "Beginner").toLowerCase();

        if (level === "advanced") {
          summary.advanced += 1;
        } else if (level === "intermediate") {
          summary.intermediate += 1;
        } else {
          summary.beginner += 1;
        }

        return summary;
      },
      { beginner: 0, intermediate: 0, advanced: 0 }
    );

    const latestUser = users
      .slice()
      .sort(
        (left, right) =>
          new Date(right.joinedAt || 0).getTime() - new Date(left.joinedAt || 0).getTime()
      )[0];

    return `
      <section class="admin-section reveal">
        <div class="admin-section__head">
          <div>
            <span class="eyebrow">Learner records</span>
            <h2>All Registered Users</h2>
          </div>
          <p>Admin can see full learner details saved in this static demo, including contact info, level, join date, and current stored password.</p>
        </div>

        ${
          users.length
            ? `
              <div class="user-summary-grid">
                <article class="admin-stat">
                  <span>Registered Users</span>
                  <strong>${users.length}</strong>
                </article>
                <article class="admin-stat">
                  <span>Beginner</span>
                  <strong>${levelCounts.beginner}</strong>
                </article>
                <article class="admin-stat">
                  <span>Intermediate</span>
                  <strong>${levelCounts.intermediate}</strong>
                </article>
                <article class="admin-stat">
                  <span>Advanced</span>
                  <strong>${levelCounts.advanced}</strong>
                </article>
              </div>

              <div class="helper-note">
                Latest registered learner: <strong>${escapeHtml(
                  latestUser?.fullName || "Not available"
                )}</strong> (${escapeHtml(latestUser?.email || "No email")}) joined on
                ${escapeHtml(formatDateTime(latestUser?.joinedAt))}.
              </div>

              <div class="table-wrap">
                <table class="user-data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Level</th>
                      <th>Password</th>
                      <th>Joined At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${users
                      .map(
                        (user) => `
                          <tr>
                            <td>${escapeHtml(user.id)}</td>
                            <td>${escapeHtml(user.fullName)}</td>
                            <td>${escapeHtml(user.email)}</td>
                            <td>${escapeHtml(user.mobile)}</td>
                            <td>${escapeHtml(user.level || "Beginner")}</td>
                            <td><code>${escapeHtml(user.password)}</code></td>
                            <td>${escapeHtml(formatDateTime(user.joinedAt))}</td>
                            <td>
                              <div class="table-actions">
                                <button class="button button-ghost button-small" type="button" data-copy-user="${escapeHtml(
                                  user.id
                                )}">
                                  Copy Details
                                </button>
                                <button class="button button-subtle button-small" type="button" data-delete-user="${escapeHtml(
                                  user.id
                                )}">
                                  Delete User
                                </button>
                              </div>
                            </td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            `
            : `
              <div class="helper-note">
                No learner accounts have been created yet. Once users sign up, their full details will appear here automatically.
              </div>
            `
        }
      </section>
    `;
  }

  function renderField(field, value = "", prefix = "field") {
    const fieldId = `${prefix}-${field.name}`;

    if (field.type === "textarea") {
      return `
        <div class="field-group">
          <label for="${fieldId}">${field.label}</label>
          <textarea class="textarea" id="${fieldId}" name="${field.name}" required>${escapeHtml(value)}</textarea>
        </div>
      `;
    }

    return `
      <div class="field-group">
        <label for="${fieldId}">${field.label}</label>
        <input class="input" id="${fieldId}" name="${field.name}" value="${escapeHtml(value)}" required />
      </div>
    `;
  }

  function renderCollectionSection(config, siteData) {
    const items = siteData[config.key];

    return `
      <section class="admin-section reveal" data-admin-section="${config.key}">
        <div class="admin-section__head">
          <div>
            <span class="eyebrow">${config.title}</span>
            <h2>${config.title}</h2>
          </div>
          <p>${config.description}</p>
        </div>
        <form class="admin-form" data-collection-form="${config.key}">
          <input type="hidden" name="id" />
          <div class="admin-grid">
            ${config.fields
              .map((field) => renderField(field, "", config.key))
              .join("")}
          </div>
          <div class="chip-row">
            <button class="button button-solid" type="submit">Save Item</button>
            <button class="button button-ghost" type="button" data-clear-collection-form="${config.key}">Clear Form</button>
          </div>
        </form>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                ${config.columns.map((column) => `<th>${column}</th>`).join("")}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                items.length
                  ? items
                      .map(
                        (item) => `
                        <tr>
                          ${config.columns
                            .map((column) => `<td>${escapeHtml(truncate(item[column]))}</td>`)
                            .join("")}
                          <td>
                            <div class="table-actions">
                              <button class="button button-ghost button-small" type="button" data-collection-edit="${config.key}" data-item-id="${item.id}">
                                Edit
                              </button>
                              <button class="button button-subtle button-small" type="button" data-collection-delete="${config.key}" data-item-id="${item.id}">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                      )
                      .join("")
                  : `<tr><td colspan="${config.columns.length + 1}">No items added yet.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderPracticeSection(siteData) {
    const flattened = siteData.practiceTracks.flatMap((track) =>
      track.items.map((item) => ({
        ...item,
        trackId: track.id,
        trackTitle: track.title,
      }))
    );

    return `
      <section class="admin-section reveal">
        <div class="admin-section__head">
          <div>
            <span class="eyebrow">Manage Practice Exercises</span>
            <h2>Manage Practice Exercises</h2>
          </div>
          <p>Add, edit, or delete daily practice lines without a backend.</p>
        </div>
        <form class="admin-form" id="practice-form">
          <input type="hidden" name="id" />
          <div class="admin-grid">
            <div class="field-group">
              <label for="practice-track">Practice section</label>
              <select class="select" id="practice-track" name="trackId" required>
                ${siteData.practiceTracks
                  .map((track) => `<option value="${track.id}">${track.title}</option>`)
                  .join("")}
              </select>
            </div>
            <div class="field-group">
              <label for="practice-hindi">Hindi or Hinglish</label>
              <input class="input" id="practice-hindi" name="hindi" required />
            </div>
            <div class="field-group">
              <label for="practice-english">English line</label>
              <textarea class="textarea" id="practice-english" name="english" required></textarea>
            </div>
            <div class="field-group">
              <label for="practice-tip">Tip</label>
              <textarea class="textarea" id="practice-tip" name="tip" required></textarea>
            </div>
          </div>
          <div class="chip-row">
            <button class="button button-solid" type="submit">Save Exercise</button>
            <button class="button button-ghost" type="button" id="clear-practice-form">Clear Form</button>
          </div>
        </form>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>Hindi</th>
                <th>English</th>
                <th>Tip</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                flattened.length
                  ? flattened
                      .map(
                        (item) => `
                        <tr>
                          <td>${truncate(item.trackTitle)}</td>
                          <td>${truncate(item.hindi)}</td>
                          <td>${truncate(item.english)}</td>
                          <td>${truncate(item.tip)}</td>
                          <td>
                            <div class="table-actions">
                              <button class="button button-ghost button-small" type="button" data-practice-edit="${item.id}">
                                Edit
                              </button>
                              <button class="button button-subtle button-small" type="button" data-practice-delete="${item.id}">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      `
                      )
                      .join("")
                  : `<tr><td colspan="5">No practice exercises added yet.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderLoginView() {
    root.innerHTML = `
      <section class="page-hero reveal">
        <div class="page-hero__copy">
          <span class="eyebrow">Admin area</span>
          <h1>Frontend admin dashboard for content management</h1>
          <p>Login to manage lessons, translator phrases, practice exercises, testimonials, homepage copy, and footer links.</p>
        </div>
      </section>

      <section class="auth-layout reveal">
        <article class="auth-card">
          <h2>Admin Login</h2>
          <p>This admin area uses a browser-side session for the current static demo.</p>
          <form class="form-stack" id="admin-login-form">
            <div class="field-group">
              <label for="admin-email">Admin email</label>
              <input class="input" id="admin-email" name="email" placeholder="Enter admin email" required />
            </div>
            <div class="field-group">
              <label for="admin-password">Password</label>
              <input class="input" id="admin-password" name="password" type="password" placeholder="Admin password" required />
            </div>
            <button class="button button-solid button-block" type="submit">Open Dashboard</button>
          </form>
        </article>
        <aside class="auth-card">
          <span class="badge">Access Notice</span>
          <h3>Restricted admin area</h3>
          <ul class="info-list">
            <li>Admin credentials are intentionally not shown on the public login screen.</li>
            <li>Browser-side login is only a temporary static-demo solution.</li>
            <li>For real production security, move admin authentication to a backend or protected API.</li>
          </ul>
        </aside>
      </section>
    `;

    document
      .getElementById("admin-login-form")
      .addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        const isValid = await isValidAdminLogin(email, password);

        if (!isValid) {
          showToast("Invalid admin credentials.", "error");
          return;
        }

        setAdminLoggedIn(true);
        showToast("Admin login successful.");
        renderDashboardView();
      });

    refreshReveal();
  }

  function renderDashboardView() {
    const siteData = getSiteData();
    const totalPracticeItems = siteData.practiceTracks.reduce(
      (total, track) => total + track.items.length,
      0
    );

    root.innerHTML = `
      <section class="page-hero reveal">
        <div class="page-hero__copy">
          <span class="eyebrow">Admin dashboard</span>
          <h1>Manage the spoken English learning experience</h1>
          <p>Update public content, practice libraries, translator examples, and footer links from one frontend-only dashboard.</p>
          <div class="hero__actions">
            <button class="button button-solid" type="button" id="admin-logout-button">Logout Admin</button>
            <a class="button button-ghost" href="index.html">View Homepage</a>
          </div>
        </div>
      </section>

      <section class="admin-layout section reveal">
        <div class="admin-stats">
          <article class="admin-stat">
            <span>Total Users</span>
            <strong>${getUsers().length}</strong>
          </article>
          <article class="admin-stat">
            <span>Total Lessons</span>
            <strong>${siteData.lessons.length}</strong>
          </article>
          <article class="admin-stat">
            <span>Total Phrases</span>
            <strong>${siteData.phrases.length}</strong>
          </article>
          <article class="admin-stat">
            <span>Translator Searches</span>
            <strong>${getTranslatorSearches()}</strong>
          </article>
        </div>

        ${renderUsersSection(getUsers())}

        <section class="admin-section reveal">
          <div class="admin-section__head">
            <div>
              <span class="eyebrow">Manage Homepage Content</span>
              <h2>Manage Homepage Content</h2>
            </div>
            <p>Update headline, subheadline, and CTA labels used on the landing page.</p>
          </div>
          <form class="admin-form" id="homepage-form">
            <div class="admin-grid">
              <div class="field-group">
                <label for="announcement">Announcement</label>
                <input class="input" id="announcement" name="announcement" value="${escapeHtml(
                  siteData.homepage.announcement
                )}" required />
              </div>
              <div class="field-group">
                <label for="hero-title">Hero title</label>
                <input class="input" id="hero-title" name="heroTitle" value="${escapeHtml(
                  siteData.homepage.heroTitle
                )}" required />
              </div>
              <div class="field-group">
                <label for="hero-subtitle">Hero subtitle</label>
                <textarea class="textarea" id="hero-subtitle" name="heroSubtitle" required>${escapeHtml(
                  siteData.homepage.heroSubtitle
                )}</textarea>
              </div>
              <div class="field-group">
                <label for="primary-cta">Primary CTA</label>
                <input class="input" id="primary-cta" name="primaryCtaLabel" value="${escapeHtml(
                  siteData.homepage.primaryCtaLabel
                )}" required />
              </div>
              <div class="field-group">
                <label for="secondary-cta">Secondary CTA</label>
                <input class="input" id="secondary-cta" name="secondaryCtaLabel" value="${escapeHtml(
                  siteData.homepage.secondaryCtaLabel
                )}" required />
              </div>
            </div>
            <button class="button button-solid" type="submit">Save Homepage Content</button>
          </form>
        </section>

        <section class="admin-section reveal">
          <div class="admin-section__head">
            <div>
              <span class="eyebrow">Manage Social Links</span>
              <h2>Manage Footer Social Links</h2>
            </div>
            <p>Replace placeholder links with your own YouTube, Instagram, Facebook, Telegram, WhatsApp, and LinkedIn URLs.</p>
          </div>
          <form class="admin-form" id="social-form">
            <div class="admin-grid">
              ${Object.entries(siteData.socialLinks)
                .map(
                  ([platform, url]) => `
                  <div class="field-group">
                    <label for="${platform}">${platform}</label>
                    <input class="input" id="${platform}" name="${platform}" value="${escapeHtml(
                      url
                    )}" required />
                  </div>
                `
                )
                .join("")}
            </div>
            <button class="button button-solid" type="submit">Save Social Links</button>
          </form>
        </section>

        ${collectionConfigs
          .map((config) => renderCollectionSection(config, siteData))
          .join("")}

        ${renderPracticeSection(siteData)}

        <section class="admin-section reveal">
          <div class="admin-section__head">
            <div>
              <span class="eyebrow">Dashboard notes</span>
              <h2>Static deployment ready</h2>
            </div>
            <p>Total practice exercises: ${totalPracticeItems}. All changes stay in browser storage until you connect a real API or CMS.</p>
          </div>
          <div class="helper-note">
            This dashboard is intentionally frontend-only so the whole project remains compatible with GitHub Pages and other static hosting workflows.
          </div>
        </section>
      </section>
    `;

    bindDashboardActions();
    refreshShell();
    refreshReveal();
  }

  function bindDashboardActions() {
    document
      .getElementById("admin-logout-button")
      ?.addEventListener("click", () => {
        setAdminLoggedIn(false);
        showToast("Admin logged out.");
        renderLoginView();
      });

    document.getElementById("homepage-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const siteData = getSiteData();
      const formData = new FormData(event.currentTarget);

      siteData.homepage = {
        announcement: String(formData.get("announcement") || ""),
        heroTitle: String(formData.get("heroTitle") || ""),
        heroSubtitle: String(formData.get("heroSubtitle") || ""),
        primaryCtaLabel: String(formData.get("primaryCtaLabel") || ""),
        secondaryCtaLabel: String(formData.get("secondaryCtaLabel") || ""),
      };

      saveSiteData(siteData);
      refreshShell();
      showToast("Homepage content updated.");
      renderDashboardView();
    });

    document.getElementById("social-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const siteData = getSiteData();
      const formData = new FormData(event.currentTarget);

      siteData.socialLinks = Object.fromEntries(
        Object.keys(siteData.socialLinks).map((platform) => [
          platform,
          String(formData.get(platform) || ""),
        ])
      );

      saveSiteData(siteData);
      refreshShell();
      showToast("Footer social links updated.");
      renderDashboardView();
    });

    document.querySelectorAll("[data-copy-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        const users = getUsers();
        const userId = button.getAttribute("data-copy-user");
        const user = users.find((entry) => entry.id === userId);

        if (!user) {
          showToast("User not found.", "error");
          return;
        }

        const text = [
          `User ID: ${user.id}`,
          `Full Name: ${user.fullName}`,
          `Email: ${user.email}`,
          `Mobile: ${user.mobile}`,
          `Level: ${user.level || "Beginner"}`,
          `Password: ${user.password}`,
          `Joined At: ${formatDateTime(user.joinedAt)}`,
        ].join("\n");

        try {
          await navigator.clipboard.writeText(text);
          showToast("User details copied.");
        } catch (error) {
          showToast("Copy is not available in this browser.", "error");
        }
      });
    });

    document.querySelectorAll("[data-delete-user]").forEach((button) => {
      button.addEventListener("click", () => {
        const userId = button.getAttribute("data-delete-user");
        const users = getUsers();
        const user = users.find((entry) => entry.id === userId);

        if (!user) {
          showToast("User not found.", "error");
          return;
        }

        const nextUsers = users.filter((entry) => entry.id !== userId);
        saveUsers(nextUsers);
        showToast(`Deleted learner account for ${user.fullName}.`);
        renderDashboardView();
      });
    });

    collectionConfigs.forEach((config) => {
      const form = document.querySelector(`[data-collection-form="${config.key}"]`);
      const clearButton = document.querySelector(
        `[data-clear-collection-form="${config.key}"]`
      );

      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        const siteData = getSiteData();
        const formData = new FormData(form);
        const existingId = String(formData.get("id") || "").trim();
        const entry = {
          id: existingId || `${config.key}-${Date.now()}`,
        };

        config.fields.forEach((field) => {
          entry[field.name] = String(formData.get(field.name) || "").trim();
        });

        if (config.key === "phrases") {
          entry.variants = [];
        }

        if (existingId) {
          siteData[config.key] = siteData[config.key].map((item) =>
            item.id === existingId ? { ...item, ...entry } : item
          );
        } else {
          siteData[config.key].push(entry);
        }

        saveSiteData(siteData);
        showToast(`${config.title} updated.`);
        renderDashboardView();
      });

      clearButton?.addEventListener("click", () => {
        form.reset();
        form.querySelector('input[name="id"]').value = "";
      });

      document
        .querySelectorAll(`[data-collection-edit="${config.key}"]`)
        .forEach((button) => {
          button.addEventListener("click", () => {
            const siteData = getSiteData();
            const itemId = button.getAttribute("data-item-id");
            const item = siteData[config.key].find((entry) => entry.id === itemId);

            if (!item) {
              return;
            }

            form.querySelector('input[name="id"]').value = item.id;
            config.fields.forEach((field) => {
              const input = form.querySelector(`[name="${field.name}"]`);
              if (input) {
                input.value = item[field.name] || "";
              }
            });

            window.scrollTo({ top: form.offsetTop - 90, behavior: "smooth" });
          });
        });

      document
        .querySelectorAll(`[data-collection-delete="${config.key}"]`)
        .forEach((button) => {
          button.addEventListener("click", () => {
            const siteData = getSiteData();
            const itemId = button.getAttribute("data-item-id");
            siteData[config.key] = siteData[config.key].filter(
              (item) => item.id !== itemId
            );
            saveSiteData(siteData);
            showToast("Item deleted.");
            renderDashboardView();
          });
        });
    });

    const practiceForm = document.getElementById("practice-form");

    practiceForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const siteData = getSiteData();
      const formData = new FormData(practiceForm);
      const itemId = String(formData.get("id") || "").trim();
      const trackId = String(formData.get("trackId") || "");
      const payload = {
        id: itemId || `practice-${Date.now()}`,
        hindi: String(formData.get("hindi") || "").trim(),
        english: String(formData.get("english") || "").trim(),
        tip: String(formData.get("tip") || "").trim(),
      };

      siteData.practiceTracks.forEach((track) => {
        track.items = track.items.filter((item) => item.id !== itemId);
      });

      const targetTrack = siteData.practiceTracks.find((track) => track.id === trackId);
      if (targetTrack) {
        targetTrack.items.push(payload);
      }

      saveSiteData(siteData);
      showToast("Practice exercise updated.");
      renderDashboardView();
    });

    document
      .getElementById("clear-practice-form")
      ?.addEventListener("click", () => {
        practiceForm.reset();
        practiceForm.querySelector('input[name="id"]').value = "";
      });

    document.querySelectorAll("[data-practice-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const siteData = getSiteData();
        const itemId = button.getAttribute("data-practice-edit");

        for (const track of siteData.practiceTracks) {
          const item = track.items.find((entry) => entry.id === itemId);
          if (item) {
            practiceForm.querySelector('input[name="id"]').value = item.id;
            practiceForm.querySelector('[name="trackId"]').value = track.id;
            practiceForm.querySelector('[name="hindi"]').value = item.hindi;
            practiceForm.querySelector('[name="english"]').value = item.english;
            practiceForm.querySelector('[name="tip"]').value = item.tip;
            window.scrollTo({ top: practiceForm.offsetTop - 90, behavior: "smooth" });
            break;
          }
        }
      });
    });

    document.querySelectorAll("[data-practice-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        const siteData = getSiteData();
        const itemId = button.getAttribute("data-practice-delete");

        siteData.practiceTracks.forEach((track) => {
          track.items = track.items.filter((item) => item.id !== itemId);
        });

        saveSiteData(siteData);
        showToast("Practice exercise deleted.");
        renderDashboardView();
      });
    });
  }

  if (isAdminLoggedIn()) {
    renderDashboardView();
  } else {
    renderLoginView();
  }
});
