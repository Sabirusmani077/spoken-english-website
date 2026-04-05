import { refreshReveal, showToast } from "./app.js";
import { getCurrentUser, registerUser, setCurrentUser } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  if (getCurrentUser()) {
    window.location.href = "practice.html";
    return;
  }

  const root = document.getElementById("page-root");
  const nextParam = new URLSearchParams(window.location.search).get("next");
  const safeNextTarget =
    nextParam && /^[a-z0-9-]+\.html$/i.test(nextParam) ? nextParam : "practice.html";

  root.innerHTML = `
    <section class="page-hero reveal">
      <div class="page-hero__copy">
        <span class="eyebrow">Create learner account</span>
        <h1>Start your spoken English journey with Hindi support</h1>
        <p>Create your account, choose your current level, and begin practicing right away.</p>
      </div>
    </section>

    <section class="auth-layout reveal">
      <article class="auth-card">
        <h2>Create Account</h2>
        <p>Set up your local learner profile for this static demo.</p>
        <form class="form-stack" id="signup-form">
          <div class="field-group">
            <label for="signup-name">Full name</label>
            <input class="input" id="signup-name" name="fullName" placeholder="Enter your full name" required />
          </div>
          <div class="field-group">
            <label for="signup-email">Email</label>
            <input class="input" id="signup-email" name="email" type="email" placeholder="name@example.com" required />
          </div>
          <div class="field-group">
            <label for="signup-mobile">Mobile number</label>
            <input class="input" id="signup-mobile" name="mobile" inputmode="tel" placeholder="10-digit mobile number" required />
          </div>
          <div class="field-group">
            <label for="signup-password">Password</label>
            <div class="password-wrap">
              <input class="input password-wrap__input" id="signup-password" name="password" type="password" minlength="6" placeholder="Create a password" required />
              <button class="password-toggle" type="button" data-toggle-primary-password>Show</button>
            </div>
          </div>
          <div class="field-group">
            <label for="signup-confirm-password">Confirm password</label>
            <div class="password-wrap">
              <input class="input password-wrap__input" id="signup-confirm-password" name="confirmPassword" type="password" minlength="6" placeholder="Confirm your password" required />
              <button class="password-toggle" type="button" data-toggle-confirm-password>Show</button>
            </div>
          </div>
          <div class="field-group">
            <label for="signup-level">Spoken English level</label>
            <select class="select" id="signup-level" name="level">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
          <button class="button button-solid button-block" type="submit">Create Account</button>
        </form>
        <p>Already have an account? <a class="inline-link" href="login.html">Login here</a></p>
      </article>

      <aside class="auth-card">
        <span class="badge">What you get</span>
        <h3>Built for confident practice</h3>
        <ul class="info-list">
          <li>Daily speaking practice tailored for Indian learners.</li>
          <li>Hindi to spoken English examples with better alternatives.</li>
          <li>Saved progress in a static, deployment-friendly setup.</li>
        </ul>
      </aside>
    </section>
  `;

  const form = document.getElementById("signup-form");
  const passwordInput = document.getElementById("signup-password");
  const confirmPasswordInput = document.getElementById("signup-confirm-password");

  function bindToggle(selector, input) {
    root.querySelector(selector).addEventListener("click", (event) => {
      const button = event.currentTarget;
      const showPassword = input.type === "password";
      input.type = showPassword ? "text" : "password";
      button.textContent = showPassword ? "Hide" : "Show";
    });
  }

  bindToggle("[data-toggle-primary-password]", passwordInput);
  bindToggle("[data-toggle-confirm-password]", confirmPasswordInput);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      mobile: String(formData.get("mobile") || "").trim(),
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
      level: String(formData.get("level") || "Beginner"),
    };

    if (!/^\d{10}$/.test(payload.mobile)) {
      showToast("Please enter a valid 10-digit mobile number.", "error");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      showToast("Password and confirm password do not match.", "error");
      return;
    }

    const result = registerUser(payload);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setCurrentUser(result.user, true);
    showToast("Account created successfully. Redirecting...");
    setTimeout(() => {
      window.location.href = safeNextTarget;
    }, 700);
  });

  refreshReveal();
});
