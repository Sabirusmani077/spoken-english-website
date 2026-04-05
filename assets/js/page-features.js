import { refreshReveal } from "./app.js";
import { getIcon } from "./ui-components.js";
import { getCurrentUser, getSiteData } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("page-root");
  const siteData = getSiteData();
  const currentUser = getCurrentUser();
  const protectedHref = (href) =>
    currentUser ? href : `login.html?next=${encodeURIComponent(href)}`;

  root.innerHTML = `
    <section class="page-hero reveal">
      <div class="page-hero__copy">
        <span class="eyebrow">Premium feature stack</span>
        <h1>Everything needed to learn spoken English with Hindi support</h1>
        <p>
          The platform is designed around translation, speaking confidence, reusable patterns, and guided learning for Indian users.
        </p>
        <div class="hero__actions">
          <a class="button button-solid" href="${protectedHref("translator.html")}">Try Translator</a>
          <a class="button button-ghost" href="${protectedHref("practice.html")}">Start Practice</a>
        </div>
      </div>
    </section>

    <section class="section reveal">
      <div class="section-header">
        <div>
          <span class="eyebrow">Core capabilities</span>
          <h2>Feature cards built for practical English growth</h2>
        </div>
        <p>All cards below are editable through the admin page and rendered from the shared content model.</p>
      </div>
      <div class="grid grid-4">
        ${siteData.featureCards
          .map(
            (feature) => `
            <article class="card">
              <div class="card__icon">${getIcon(feature.icon)}</div>
              <div class="card__meta">
                <span class="badge">${feature.badge}</span>
                <h3>${feature.title}</h3>
                <p>${feature.description}</p>
              </div>
            </article>
          `
          )
          .join("")}
      </div>
    </section>

    <section class="section reveal">
      <div class="section-header">
        <div>
          <span class="eyebrow">How it works</span>
          <h2>A simple flow that feels natural to Hindi-speaking learners</h2>
        </div>
        <p>Focus on understanding, repetition, and realistic speaking situations instead of only memorizing rules.</p>
      </div>
      <div class="grid grid-3">
        <article class="spotlight-card">
          <span class="badge">Step 1</span>
          <h3>Think in Hindi</h3>
          <p>Start with the sentence you really want to say, whether it is Hindi or Hinglish.</p>
        </article>
        <article class="spotlight-card">
          <span class="badge">Step 2</span>
          <h3>See natural English</h3>
          <p>Understand the literal version, the natural spoken version, and a more fluent alternative.</p>
        </article>
        <article class="spotlight-card">
          <span class="badge">Step 3</span>
          <h3>Practice out loud</h3>
          <p>Use lessons, daily challenges, and conversation drills to build confident speaking habits.</p>
        </article>
      </div>
    </section>

    <section class="section reveal">
      <div class="section-header">
        <div>
          <span class="eyebrow">Built-in advantages</span>
          <h2>Why the platform feels practical from day one</h2>
        </div>
        <p>Designed for mobile use, easy explanations, and real-life conversations in Indian contexts.</p>
      </div>
      <ul class="advantage-list">
        ${siteData.advantages.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </section>

    <section class="section reveal">
      <div class="grid grid-2">
        <article class="spotlight-card">
          <span class="badge">Frontend-ready smart feature</span>
          <h3>Voice input and pronunciation practice UI</h3>
          <p>
            The translator page includes browser speech input and spoken playback. You can later connect speech scoring or AI pronunciation APIs.
          </p>
        </article>
        <article class="spotlight-card">
          <span class="badge">Frontend-ready smart feature</span>
          <h3>Favorites, progress tracker, and daily challenge</h3>
          <p>
            Learners can save favorite phrases and track practice progress locally even in a static deployment.
          </p>
        </article>
      </div>
    </section>
  `;

  refreshReveal();
});
