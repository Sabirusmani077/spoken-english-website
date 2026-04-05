import { refreshReveal, showToast } from "./app.js";
import { getCurrentUser, getSiteData } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  if (!getCurrentUser()) {
    return;
  }

  const root = document.getElementById("page-root");
  const siteData = getSiteData();
  let activeLessonId = siteData.lessons[0]?.id;

  function getActiveLesson() {
    return siteData.lessons.find((lesson) => lesson.id === activeLessonId) || siteData.lessons[0];
  }

  function renderPage() {
    const activeLesson = getActiveLesson();

    root.innerHTML = `
      <section class="page-hero reveal">
        <div class="page-hero__copy">
          <span class="eyebrow">Courses and lessons</span>
          <h1>Structured spoken English learning for every stage</h1>
          <p>
            Learn step by step with lessons focused on practical speaking, Hindi to English thinking, and real-life fluency.
          </p>
          <div class="hero__actions">
            <a class="button button-solid" href="practice.html">Practice Now</a>
            <a class="button button-ghost" href="signup.html">Create Account</a>
          </div>
        </div>
      </section>

      <section class="course-layout reveal">
        <div class="grid">
          ${siteData.lessons
            .map(
              (lesson) => `
              <article class="card course-card">
                <span class="badge">${lesson.level}</span>
                <h3>${lesson.title}</h3>
                <p>${lesson.description}</p>
                <div class="course-meta">
                  <span>${lesson.duration}</span>
                  <span>${lesson.focus}</span>
                </div>
                <button class="button button-ghost" type="button" data-start-lesson="${lesson.id}">
                  Start Lesson
                </button>
              </article>
            `
            )
            .join("")}
        </div>
        <aside class="course-preview">
          <span class="eyebrow">Selected lesson</span>
          <h2>${activeLesson.title}</h2>
          <p>${activeLesson.description}</p>
          <div class="course-preview__meta">
            <strong>Level</strong>
            <p>${activeLesson.level}</p>
            <strong>Duration</strong>
            <p>${activeLesson.duration}</p>
            <strong>Speaking focus</strong>
            <p>${activeLesson.focus}</p>
          </div>
          <div class="helper-note">
            This static demo opens a lesson preview panel. You can later connect lesson detail pages, markdown content, or an API-backed CMS.
          </div>
          <a class="button button-solid" href="practice.html">Move to practice drills</a>
        </aside>
      </section>
    `;

    root.querySelectorAll("[data-start-lesson]").forEach((button) => {
      button.addEventListener("click", () => {
        activeLessonId = button.getAttribute("data-start-lesson");
        renderPage();
        refreshReveal();
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Lesson preview updated.");
      });
    });
  }

  renderPage();
  refreshReveal();
});
