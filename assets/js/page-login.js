import { refreshReveal, showToast } from "./app.js";
import {
  authenticateUser,
  getCurrentUser,
  setCurrentUser,
} from "./storage.js";

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
        <span class="eyebrow">Learner login</span>
        <h1>Welcome back to your spoken English practice</h1>
        <p>Log in to continue learning, save your progress, and return to your favorite phrase patterns.</p>
      </div>
    </section>

    <section class="auth-layout reveal">
      <article class="auth-card">
        <h2>Login</h2>
        <p>Use your email or the full name you signed up with.</p>
        <form class="form-stack" id="login-form">
          <div class="field-group">
            <label for="login-identifier">Email or username</label>
            <input class="input" id="login-identifier" name="identifier" placeholder="name@example.com" required />
          </div>
          <div class="field-group">
            <label for="login-password">Password</label>
            <div class="password-wrap">
              <input class="input" id="login-password" name="password" type="password" placeholder="Enter password" required />
              <button class="button button-ghost button-small" type="button" data-toggle-password>Show</button>
            </div>
          </div>
          <div class="field-inline">
            <label class="checkbox-line">
              <input type="checkbox" name="remember" checked />
              <span>Remember me</span>
            </label>
            <button class="button button-subtle button-small" type="button" data-forgot-password>Forgot password</button>
          </div>
          <button class="button button-solid button-block" type="submit">Login</button>
        </form>
        <p>Do not have an account yet? <a class="inline-link" href="signup.html">Create Account</a></p>
      </article>

      <aside class="auth-card">
        <span class="badge">Static demo notes</span>
        <h3>How this login works</h3>
        <ul class="info-list">
          <li>Accounts created on the signup page are stored locally in your browser.</li>
          <li>This makes the project easy to host on GitHub Pages without a backend.</li>
          <li>You can connect a real auth API later without changing the page layout.</li>
        </ul>
      </aside>
    </section>
  `;

  const form = document.getElementById("login-form");
  const passwordInput = document.getElementById("login-password");

  root.querySelector("[data-toggle-password]").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const showPassword = passwordInput.type === "password";
    passwordInput.type = showPassword ? "text" : "password";
    button.textContent = showPassword ? "Hide" : "Show";
  });

  root.querySelector("[data-forgot-password]").addEventListener("click", () => {
    showToast(
      "Add your password reset flow here later. This static version keeps auth frontend-only.",
      "error"
    );
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const identifier = String(formData.get("identifier") || "").trim();
    const password = String(formData.get("password") || "");
    const remember = formData.get("remember") === "on";

    const result = authenticateUser(identifier, password);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    setCurrentUser(result.user, remember);
    showToast("Login successful. Redirecting...");
    setTimeout(() => {
      window.location.href = safeNextTarget;
    }, 700);
  });

  refreshReveal();
});
