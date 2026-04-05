import { refreshReveal, showToast } from "./app.js";
import {
  getDailyChallenge,
  getFavorites,
  getCurrentUser,
  getPhraseOfTheDay,
  getPracticeProgress,
  getSiteData,
  getSpeakingPracticeResponses,
  saveSpeakingPracticeResponse,
  togglePracticeItem,
} from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const root = document.getElementById("page-root");
  const siteData = getSiteData();
  const challenge = getDailyChallenge();
  const phraseOfDay = getPhraseOfTheDay();
  let savedResponses = getSpeakingPracticeResponses(currentUser.id);
  let draftResponses = Object.fromEntries(
    Object.entries(savedResponses).map(([questionId, entry]) => [questionId, entry.answer || ""])
  );
  let reviewState = {};
  let modelAnswerState = {};

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function evaluateAnswer(answer, question) {
    const normalizedAnswer = normalizeText(answer);
    const tokenCount = normalizedAnswer ? normalizedAnswer.split(" ").length : 0;
    const keywordMatches = question.keywords.filter((keyword) =>
      normalizedAnswer.includes(normalizeText(keyword))
    ).length;
    const keywordRatio = question.keywords.length
      ? keywordMatches / question.keywords.length
      : 0;

    if (!normalizedAnswer) {
      return null;
    }

    if (keywordRatio >= 0.6 || (keywordRatio >= 0.4 && tokenCount >= 8)) {
      return {
        tone: "strong",
        label: "Strong spoken answer",
        message:
          "This answer sounds usable and covers the main spoken idea well. Keep repeating it aloud for fluency.",
      };
    }

    if (keywordRatio >= 0.25 || tokenCount >= 6) {
      return {
        tone: "good",
        label: "Good start",
        message:
          "You are on the right track. Make it a little smoother by using one of the suggested patterns or the model answer style.",
      };
    }

    return {
      tone: "improve",
      label: "Needs more spoken structure",
      message:
        "Try a fuller spoken sentence. Use the hint, then compare your answer with the model answer below.",
    };
  }

  function formatSavedTime(value) {
    if (!value) {
      return "";
    }

    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value));
    } catch (error) {
      return "";
    }
  }

  function speakText(text) {
    if (!("speechSynthesis" in window)) {
      showToast("Speech playback is not supported in this browser.", "error");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function captureDraft(questionId) {
    const textarea = root.querySelector(`[data-answer-input="${questionId}"]`);

    if (!textarea) {
      return "";
    }

    draftResponses[questionId] = textarea.value;
    return textarea.value;
  }

  function renderSpeakingQuestions() {
    return `
      <div class="practice-qa-grid">
        ${siteData.speakingPracticeQuestions
          .map((question) => {
            const savedEntry = savedResponses[question.id];
            const currentDraft = draftResponses[question.id] || "";
            const feedback = reviewState[question.id] || null;
            const showModel = Boolean(modelAnswerState[question.id]);

            return `
              <article class="practice-question-card">
                <div class="practice-question-card__head">
                  <div>
                    <span class="badge">Speaking practice</span>
                    <h3>${escapeHtml(question.question)}</h3>
                  </div>
                  <button class="speaker-button" type="button" data-speak-model="${question.id}">
                    Listen Model
                  </button>
                </div>
                <p>${escapeHtml(question.prompt)}</p>
                <div class="helper-note">
                  Hint: ${escapeHtml(question.hint)}
                </div>
                <div class="field-group">
                  <label for="practice-answer-${question.id}">Your spoken answer</label>
                  <textarea
                    class="textarea"
                    id="practice-answer-${question.id}"
                    data-answer-input="${question.id}"
                    placeholder="Write your spoken English answer here..."
                  >${escapeHtml(currentDraft)}</textarea>
                </div>
                <div class="practice-answer-actions">
                  <button class="button button-solid" type="button" data-check-answer="${question.id}">
                    Check Answer
                  </button>
                  <button class="button button-ghost" type="button" data-save-answer="${question.id}">
                    Save Practice
                  </button>
                  <button class="button button-subtle" type="button" data-toggle-model="${question.id}">
                    ${showModel ? "Hide Model Answer" : "Show Model Answer"}
                  </button>
                </div>
                ${
                  feedback
                    ? `
                      <div class="practice-feedback practice-feedback--${feedback.tone}">
                        <strong>${escapeHtml(feedback.label)}</strong>
                        <p>${escapeHtml(feedback.message)}</p>
                      </div>
                    `
                    : ""
                }
                ${
                  showModel
                    ? `
                      <div class="model-answer">
                        <div class="practice-question-card__head">
                          <strong>Model Answer</strong>
                          <button class="speaker-button" type="button" data-speak-text="${escapeHtml(
                            question.sampleAnswer
                          )}">
                            Speaker
                          </button>
                        </div>
                        <p>${escapeHtml(question.sampleAnswer)}</p>
                      </div>
                    `
                    : ""
                }
                ${
                  savedEntry
                    ? `<div class="saved-answer-meta">Saved on ${escapeHtml(
                        formatSavedTime(savedEntry.savedAt)
                      )}</div>`
                    : ""
                }
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderPage() {
    const progress = getPracticeProgress();
    const favoriteIds = getFavorites();
    const favoritePhrases = siteData.phrases.filter((phrase) =>
      favoriteIds.includes(phrase.id)
    );
    const allItems = siteData.practiceTracks.flatMap((track) => track.items);
    const completedCount = allItems.filter((item) => progress[item.id]).length;
    const percentage = allItems.length
      ? Math.round((completedCount / allItems.length) * 100)
      : 0;
    const savedAnswerCount = Object.keys(savedResponses).length;

    root.innerHTML = `
      <section class="page-hero reveal">
        <div class="page-hero__copy">
          <span class="eyebrow">Daily spoken English practice</span>
          <h1>Practice spoken English with phrases, drills, and answer writing</h1>
          <p>
            Build fluency with real spoken phrases, daily-use sentence banks, and an interactive practice section that asks questions and lets you write answers.
          </p>
        </div>
      </section>

      <section class="grid grid-3 section reveal">
        <article class="challenge-card">
          <span class="badge">Daily challenge</span>
          <h3>${escapeHtml(challenge)}</h3>
          <p>Repeat the phrase below aloud five times before moving into the practice library.</p>
          <div class="output-item">
            <strong>${escapeHtml(phraseOfDay.hindi)}</strong>
            <p>${escapeHtml(phraseOfDay.naturalEnglish)}</p>
          </div>
        </article>
        <article class="challenge-card">
          <span class="badge">Progress tracker</span>
          <h3>${completedCount} of ${allItems.length} drills completed</h3>
          <div class="progress-bar"><span style="width: ${percentage}%;"></span></div>
          <p>${percentage}% complete in this browser session.</p>
        </article>
        <article class="challenge-card">
          <span class="badge">Answer practice</span>
          <h3>${savedAnswerCount} speaking answers saved</h3>
          <p>Write your own answers below, save them, and compare them with the model answers any time.</p>
          <div class="helper-note">
            Practice answers are stored locally in your browser for static-hosting compatibility.
          </div>
        </article>
      </section>

      <section class="section reveal">
        <div class="section-header">
          <div>
            <span class="eyebrow">Saved favorites</span>
            <h2>Favorite phrases you want to remember</h2>
          </div>
          <a class="inline-link" href="translator.html">Add more from translator</a>
        </div>
        ${
          favoritePhrases.length
            ? `<div class="grid grid-2">
                ${favoritePhrases
                  .map(
                    (phrase) => `
                      <article class="spotlight-card">
                        <strong>${escapeHtml(phrase.hindi)}</strong>
                        <p>${escapeHtml(phrase.naturalEnglish)}</p>
                        <p>Better alternative: ${escapeHtml(phrase.betterAlternative)}</p>
                      </article>
                    `
                  )
                  .join("")}
              </div>`
            : `<div class="empty-state">No favorite phrases yet. Save phrases from the translator page to build your own speaking bank.</div>`
        }
      </section>

      <section class="section reveal">
        <div class="section-header">
          <div>
            <span class="eyebrow">Spoken phrase bank</span>
            <h2>Most-used spoken English phrases for daily practice</h2>
          </div>
          <p>These are the kinds of short natural phrases people actually use in spoken English conversations.</p>
        </div>
        <div class="spoken-group-grid">
          ${siteData.spokenPhraseGroups
            .map(
              (group) => `
                <article class="spoken-group-card">
                  <div>
                    <span class="badge">${escapeHtml(group.title)}</span>
                    <h3>${escapeHtml(group.title)}</h3>
                    <p>${escapeHtml(group.intro)}</p>
                  </div>
                  <div class="spoken-group-list">
                    ${group.items
                      .map(
                        (item) => `
                          <article class="spoken-group-item">
                            <div class="spoken-group-item__head">
                              <strong>${escapeHtml(item.phrase)}</strong>
                              <button class="speaker-button" type="button" data-speak-phrase="${escapeHtml(
                                item.phrase
                              )}">
                                Listen
                              </button>
                            </div>
                            <p>${escapeHtml(item.meaning)}</p>
                            <span class="phrase-meta">Best use: ${escapeHtml(item.use)}</span>
                          </article>
                        `
                      )
                      .join("")}
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
            <span class="eyebrow">Interactive speaking section</span>
            <h2>Answer practice questions in your own words</h2>
          </div>
          <p>The page asks a question, you write your answer, and then you can check it against the model answer.</p>
        </div>
        <div class="helper-note">
          Tip: write your answer first, check the feedback, then listen to the model answer and say it aloud.
        </div>
        ${renderSpeakingQuestions()}
      </section>

      ${siteData.practiceTracks
        .map(
          (track) => `
            <section class="section reveal">
              <div class="section-header">
                <div>
                  <span class="eyebrow">${escapeHtml(track.title)}</span>
                  <h2>${escapeHtml(track.title)}</h2>
                </div>
                <p>${escapeHtml(track.intro)}</p>
              </div>
              <div class="grid grid-3">
                ${track.items
                  .map(
                    (item) => `
                      <article class="card">
                        <div class="card__meta">
                          <strong>${escapeHtml(item.hindi)}</strong>
                          <p>${escapeHtml(item.english)}</p>
                          <p>Tip: ${escapeHtml(item.tip)}</p>
                          <div class="practice-answer-actions">
                            <button class="button ${
                              progress[item.id] ? "button-solid" : "button-ghost"
                            }" type="button" data-practice-toggle="${item.id}">
                              ${progress[item.id] ? "Completed" : "Mark as complete"}
                            </button>
                            <button class="speaker-button" type="button" data-speak-phrase="${escapeHtml(
                              item.english
                            )}">
                              Listen
                            </button>
                          </div>
                        </div>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}

      <section class="section reveal">
        <div class="grid grid-2">
          <article class="spotlight-card">
            <span class="badge">Phrase reminder</span>
            <h3>Repeat useful phrases until they feel natural</h3>
            <p>
              Keep practicing short spoken lines like "Give me a second", "I'm on my way", and "Let me get back to you" until they come automatically.
            </p>
          </article>
          <article class="spotlight-card">
            <span class="badge">Confidence booster</span>
            <h3>Speak even when you are unsure</h3>
            <ul class="bullet-list">
              <li>Start with short clear phrases.</li>
              <li>Use polite fillers instead of going silent.</li>
              <li>Write an answer, then say it aloud three times.</li>
            </ul>
          </article>
        </div>
      </section>
    `;

    root.querySelectorAll("[data-answer-input]").forEach((textarea) => {
      textarea.addEventListener("input", () => {
        draftResponses[textarea.getAttribute("data-answer-input")] = textarea.value;
      });
    });

    root.querySelectorAll("[data-practice-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        togglePracticeItem(button.getAttribute("data-practice-toggle"));
        renderPage();
        refreshReveal();
        showToast("Practice progress updated.");
      });
    });

    root.querySelectorAll("[data-speak-phrase]").forEach((button) => {
      button.addEventListener("click", () => {
        speakText(button.getAttribute("data-speak-phrase"));
      });
    });

    root.querySelectorAll("[data-speak-model]").forEach((button) => {
      button.addEventListener("click", () => {
        const question = siteData.speakingPracticeQuestions.find(
          (entry) => entry.id === button.getAttribute("data-speak-model")
        );

        if (question) {
          speakText(question.sampleAnswer);
        }
      });
    });

    root.querySelectorAll("[data-speak-text]").forEach((button) => {
      button.addEventListener("click", () => {
        speakText(button.getAttribute("data-speak-text"));
      });
    });

    root.querySelectorAll("[data-check-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const questionId = button.getAttribute("data-check-answer");
        const question = siteData.speakingPracticeQuestions.find(
          (entry) => entry.id === questionId
        );
        const answer = captureDraft(questionId).trim();

        if (!question || !answer) {
          showToast("Write your answer first.", "error");
          return;
        }

        reviewState[questionId] = evaluateAnswer(answer, question);
        renderPage();
        refreshReveal();
        showToast("Answer checked.");
      });
    });

    root.querySelectorAll("[data-save-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const questionId = button.getAttribute("data-save-answer");
        const question = siteData.speakingPracticeQuestions.find(
          (entry) => entry.id === questionId
        );
        const answer = captureDraft(questionId).trim();

        if (!question || !answer) {
          showToast("Please write an answer before saving.", "error");
          return;
        }

        reviewState[questionId] = evaluateAnswer(answer, question);
        saveSpeakingPracticeResponse(currentUser.id, questionId, answer);
        savedResponses = getSpeakingPracticeResponses(currentUser.id);
        draftResponses[questionId] = answer;
        renderPage();
        refreshReveal();
        showToast("Practice answer saved.");
      });
    });

    root.querySelectorAll("[data-toggle-model]").forEach((button) => {
      button.addEventListener("click", () => {
        const questionId = button.getAttribute("data-toggle-model");
        captureDraft(questionId);
        modelAnswerState[questionId] = !modelAnswerState[questionId];
        renderPage();
        refreshReveal();
      });
    });
  }

  renderPage();
  refreshReveal();
});
