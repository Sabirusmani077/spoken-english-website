import { refreshReveal } from "./app.js";
import { getIcon } from "./ui-components.js";
import {
  getCurrentUser,
  getPhraseOfTheDay,
  getSiteData,
  getWordOfTheDay,
} from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("page-root");
  const siteData = getSiteData();
  const currentUser = getCurrentUser();
  const wordOfTheDay = getWordOfTheDay();
  const phraseOfTheDay = getPhraseOfTheDay();
  const whyChooseIcons = ["translate", "conversation", "practice"];
  const protectedHref = (href) =>
    currentUser ? href : `login.html?next=${encodeURIComponent(href)}`;

  root.innerHTML = `
    <section class="hero reveal">
      <div class="hero__copy">
        <span class="eyebrow">${siteData.homepage.announcement}</span>
        <div class="brand-hero">
          <span class="brand-hero__avatar">
            <img src="${siteData.brand.photoUrl}" alt="Mr Sabir portrait" />
          </span>
          <span class="brand-hero__text">
            <span class="brand-hero__label">Personal brand</span>
            <strong>
              <span>english</span>
              <span>with</span>
              <span>mr sabir</span>
            </strong>
          </span>
        </div>
        <div class="stack-actions" style="gap: 16px;">
          <h1>${siteData.homepage.heroTitle}</h1>
          <p>${siteData.homepage.heroSubtitle}</p>
        </div>
        <div class="hero__actions">
          <a class="button button-solid" href="${protectedHref("courses.html")}">${siteData.homepage.primaryCtaLabel}</a>
          <a class="button button-ghost" href="${protectedHref("translator.html")}">${siteData.homepage.secondaryCtaLabel}</a>
          <a class="button button-subtle" href="login.html">Login</a>
          <a class="button button-ghost" href="signup.html">Create Account</a>
        </div>
        <div class="hero__trust">
          <span class="mini-chip">Hindi support</span>
          <span class="mini-chip">Natural spoken English</span>
          <span class="mini-chip">Daily practice plans</span>
        </div>
      </div>
      <div class="hero-visual">
        <div class="glass-card hero-visual__panel">
          <div class="translation-preview">
            <span class="translation-preview__label">Live example</span>
            <div class="translation-preview__content">
              <div class="translation-preview__row">
                <span class="muted">Hindi thought</span>
                <strong>main market ja raha hu</strong>
              </div>
              <div class="translation-preview__row">
                <span class="muted">Natural English</span>
                <strong>I'm going to the market.</strong>
              </div>
              <div class="translation-preview__row">
                <span class="muted">Better alternative</span>
                <strong>I'm heading to the market.</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-2">
          <div class="card-stat">
            <span>Phrase of the day</span>
            <strong>${phraseOfTheDay.naturalEnglish}</strong>
          </div>
          <div class="card-stat">
            <span>Word of the day</span>
            <strong>${wordOfTheDay.word}</strong>
          </div>
        </div>
      </div>
    </section>

    <section class="stats-strip reveal">
      <div class="grid grid-4">
        ${siteData.stats
          .map(
            (stat) => `
            <article class="stat-item">
              <strong>${stat.value}</strong>
              <span>${stat.label}</span>
            </article>
          `
          )
          .join("")}
      </div>
    </section>

    <section class="section reveal">
      <div class="section-header">
        <div>
          <span class="eyebrow">Why learners choose us</span>
          <h2>Built for real spoken English, not just grammar notes</h2>
        </div>
        <p>
          english with mr sabir is designed around how Indian learners actually think, translate, and speak in real conversations.
        </p>
      </div>
      <div class="grid grid-3">
        ${siteData.whyChooseUs
          .map(
            (item, index) => `
            <article class="card">
              <div class="card__icon">${getIcon(
                siteData.featureCards[index]?.icon || whyChooseIcons[index] || "insight"
              )}</div>
              <div class="card__meta">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
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
          <span class="eyebrow">Feature highlights</span>
          <h2>Everything learners need in one premium platform</h2>
        </div>
        <a class="inline-link" href="features.html">See all features</a>
      </div>
      <div class="grid grid-4">
        ${siteData.featureCards
          .slice(0, 8)
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
          <span class="eyebrow">Daily learning tools</span>
          <h2>Practice, remember, and speak with confidence</h2>
        </div>
        <p>
          Frontend-ready tools like phrase-of-the-day, challenge prompts, and favorites help learners stay consistent.
        </p>
      </div>
      <div class="spotlight-grid grid grid-2">
        <article class="spotlight-card">
          <span class="badge">Phrase of the day</span>
          <strong>${phraseOfTheDay.hindi}</strong>
          <p>${phraseOfTheDay.naturalEnglish}</p>
          <p>Better alternative: ${phraseOfTheDay.betterAlternative}</p>
          <a class="button button-ghost" href="${protectedHref("translator.html")}">Practice in translator</a>
        </article>
        <article class="spotlight-card">
          <span class="badge">Word of the day</span>
          <strong>${wordOfTheDay.word}</strong>
          <p>Hindi meaning: ${wordOfTheDay.hindiMeaning}</p>
          <p>Use case: ${wordOfTheDay.useCase}</p>
          <a class="button button-ghost" href="${protectedHref("practice.html")}">Go to daily practice</a>
        </article>
      </div>
    </section>

    <section class="section reveal">
      <div class="section-header">
        <div>
          <span class="eyebrow">Advantages</span>
          <h2>Why this method works better for Hindi-speaking learners</h2>
        </div>
        <p>
          We focus on natural expressions, repeatable patterns, and simple explanations so learners improve faster.
        </p>
      </div>
      <ul class="advantage-list">
        ${siteData.advantages.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </section>

    <section class="section reveal">
      <div class="section-header">
        <div>
          <span class="eyebrow">Testimonials</span>
          <h2>Trusted by Indian learners building real speaking confidence</h2>
        </div>
        <p>These sample testimonials are editable later from the admin dashboard.</p>
      </div>
      <div class="grid grid-3">
        ${siteData.testimonials
          .map(
            (item) => `
            <article class="quote-card">
              <div class="quote-card__rating">${item.rating}/5 rating</div>
              <p>"${item.quote}"</p>
              <div>
                <h3>${item.name}</h3>
                <p>${item.role}</p>
              </div>
            </article>
          `
          )
          .join("")}
      </div>
    </section>

    <section class="section reveal">
      <div class="page-hero">
        <div class="page-hero__copy">
          <span class="eyebrow">Start speaking now</span>
          <h2>Turn Hindi thoughts into clear, natural English every day</h2>
          <p>
            Explore courses, test the translator, or create an account to save your progress in this static demo.
          </p>
          <div class="hero__actions">
            <a class="button button-solid" href="${protectedHref("practice.html")}">Start Practice</a>
            <a class="button button-ghost" href="signup.html">Create Learner Account</a>
            <a class="button button-subtle" href="admin.html">Open Admin Dashboard</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section reveal" id="terms">
      <div class="grid grid-3">
        <article class="spotlight-card">
          <h3>Terms</h3>
          <p>This static version is a frontend demonstration. Replace placeholders with your production policies before launch.</p>
        </article>
        <article class="spotlight-card" id="privacy">
          <h3>Privacy</h3>
          <p>Demo account and admin changes are stored locally in the browser using localStorage unless you connect a backend later.</p>
        </article>
        <article class="spotlight-card" id="contact">
          <h3>Contact</h3>
          <p>Update the footer email and social links from the admin page or directly in the shared data file.</p>
        </article>
      </div>
    </section>
  `;

  refreshReveal();
});
