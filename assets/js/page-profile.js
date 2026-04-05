import { refreshReveal, refreshShell, showToast } from "./app.js";
import { getCurrentUser, updateUserProfile } from "./storage.js";

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

function renderAvatarMarkup(user) {
  if (user?.avatarDataUrl) {
    return `<img src="${user.avatarDataUrl}" alt="${user.fullName}" />`;
  }

  return `<span class="profile-avatar__initials">${getUserInitials(user?.fullName)}</span>`;
}

function formatJoinedDate(value) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch (error) {
    return "Recent";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const root = document.getElementById("page-root");

  function renderPage() {
    root.innerHTML = `
      <section class="page-hero reveal">
        <div class="page-hero__copy">
          <span class="eyebrow">Learner profile</span>
          <h1>Your account details and profile photo</h1>
          <p>Check your saved learner details, update your profile photo, and keep your account information current.</p>
        </div>
      </section>

      <section class="profile-layout reveal">
        <article class="auth-card profile-summary-card">
          <div class="profile-avatar" id="profile-avatar-preview">
            ${renderAvatarMarkup(currentUser)}
          </div>
          <div class="profile-summary-card__meta">
            <span class="badge">Learner profile</span>
            <h2>${currentUser.fullName}</h2>
            <p>${currentUser.level} learner</p>
          </div>
          <div class="profile-stats-grid">
            <div class="profile-stat-card">
              <span>Email</span>
              <strong>${currentUser.email}</strong>
            </div>
            <div class="profile-stat-card">
              <span>Mobile</span>
              <strong>${currentUser.mobile}</strong>
            </div>
            <div class="profile-stat-card">
              <span>Joined</span>
              <strong>${formatJoinedDate(currentUser.joinedAt)}</strong>
            </div>
            <div class="profile-stat-card">
              <span>Level</span>
              <strong>${currentUser.level}</strong>
            </div>
          </div>
        </article>

        <article class="auth-card">
          <span class="badge">Update profile</span>
          <h2>Edit your learner details</h2>
          <p>Your changes are stored in this browser for this demo account.</p>

          <form class="form-stack" id="profile-form">
            <div class="field-group">
              <label for="profile-photo">Profile photo</label>
              <input class="input" id="profile-photo" name="avatar" type="file" accept="image/*" />
            </div>
            <div class="field-group">
              <label for="profile-name">Full name</label>
              <input class="input" id="profile-name" name="fullName" value="${currentUser.fullName}" required />
            </div>
            <div class="field-group">
              <label for="profile-email">Email</label>
              <input class="input" id="profile-email" name="email" type="email" value="${currentUser.email}" required />
            </div>
            <div class="field-group">
              <label for="profile-mobile">Mobile number</label>
              <input class="input" id="profile-mobile" name="mobile" inputmode="tel" value="${currentUser.mobile}" required />
            </div>
            <div class="field-group">
              <label for="profile-level">Spoken English level</label>
              <select class="select" id="profile-level" name="level">
                <option ${currentUser.level === "Beginner" ? "selected" : ""}>Beginner</option>
                <option ${currentUser.level === "Intermediate" ? "selected" : ""}>Intermediate</option>
                <option ${currentUser.level === "Advanced" ? "selected" : ""}>Advanced</option>
              </select>
            </div>
            <button class="button button-solid button-block" type="submit">Save Profile</button>
          </form>
        </article>
      </section>
    `;

    const form = document.getElementById("profile-form");
    const photoInput = document.getElementById("profile-photo");
    const avatarPreview = document.getElementById("profile-avatar-preview");
    let pendingAvatarDataUrl = currentUser.avatarDataUrl || "";

    photoInput.addEventListener("change", () => {
      const [file] = photoInput.files || [];

      if (!file) {
        pendingAvatarDataUrl = currentUser.avatarDataUrl || "";
        avatarPreview.innerHTML = renderAvatarMarkup({
          ...currentUser,
          avatarDataUrl: pendingAvatarDataUrl,
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showToast("Please choose an image smaller than 2 MB.", "error");
        photoInput.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        pendingAvatarDataUrl = String(reader.result || "");
        avatarPreview.innerHTML = renderAvatarMarkup({
          ...currentUser,
          avatarDataUrl: pendingAvatarDataUrl,
        });
      };
      reader.onerror = () => {
        showToast("Image could not be loaded. Please try another photo.", "error");
      };
      reader.readAsDataURL(file);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        mobile: String(formData.get("mobile") || "").trim(),
        level: String(formData.get("level") || "Beginner"),
        avatarDataUrl: pendingAvatarDataUrl,
      };

      if (!payload.fullName) {
        showToast("Please enter your full name.", "error");
        return;
      }

      if (!/^\d{10}$/.test(payload.mobile)) {
        showToast("Please enter a valid 10-digit mobile number.", "error");
        return;
      }

      const result = updateUserProfile(currentUser.id, payload);

      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }

      currentUser = result.user;
      pendingAvatarDataUrl = currentUser.avatarDataUrl || "";
      refreshShell();
      renderPage();
      refreshReveal();
      showToast("Profile updated successfully.");
    });
  }

  renderPage();
  refreshReveal();
});
