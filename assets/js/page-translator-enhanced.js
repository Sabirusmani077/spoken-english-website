import { refreshReveal, showToast } from "./app.js";
import {
  getCurrentUser,
  getFavorites,
  getSiteData,
  getTranslationHistory,
  incrementTranslatorSearches,
  pushTranslationHistory,
  toggleFavoritePhrase,
} from "./storage.js";
import { translateText } from "./translator-service.js";

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  const root = document.getElementById("page-root");
  const siteData = getSiteData();
  let latestResult = null;
  let translationHistory = getTranslationHistory(currentUser.id);
  const DEFAULT_MODE = "hi-to-en";
  const MODE_CONFIG = {
    "hi-to-en": {
      sourceLabel: "Hindi / Hinglish",
      inputLabel: "Write your Hindi or Hinglish sentence",
      inputPlaceholder: "Type your Hindi or Hinglish sentence here...",
      inputHint: "Best result: write the complete sentence clearly, just like you would enter it in a translator.",
      targetTitle: "Your English result will appear here.",
      targetSupport: "Type a full Hindi or Hinglish sentence above and tap the center translate button.",
      basicLabel: "Basic English",
      basicPreview: "Clean translation preview",
      naturalLabel: "Natural English",
      naturalPreview: "Fluent spoken version preview",
      betterLabel: "Better Alternative",
      betterPreview: "Smoother upgrade preview",
      voicePrompt: "Speak in Hindi or Hinglish",
      voiceRecognitionLang: "hi-IN",
      speakerOptions: [
        { value: "en-IN", label: "English (India)" },
        { value: "en-US", label: "English (US)" },
        { value: "en-GB", label: "English (UK)" },
      ],
    },
    "en-to-hi": {
      sourceLabel: "English",
      inputLabel: "Write your English sentence",
      inputPlaceholder: "Type your English sentence here...",
      inputHint: "Best result: write the complete English sentence clearly so the Hindi meaning stays natural.",
      targetTitle: "Your Hindi result will appear here.",
      targetSupport: "Type a full English sentence above and tap the center translate button.",
      basicLabel: "Basic Hindi",
      basicPreview: "Direct Hindi translation preview",
      naturalLabel: "Natural Hindi",
      naturalPreview: "Natural Hindi preview",
      betterLabel: "Easy Hindi Meaning",
      betterPreview: "Easy meaning preview",
      voicePrompt: "Speak in English",
      voiceRecognitionLang: "en-IN",
      speakerOptions: [{ value: "hi-IN", label: "Hindi (India)" }],
    },
  };

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function translatorControlIcon(name) {
    const icons = {
      mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-5 0v-5A2.5 2.5 0 0 1 12 4Zm5 7.2a5 5 0 0 1-10 0M12 18v2m-3 0h6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
      clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/></svg>',
      sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h4l5-4v12l-5-4H5zm11 7a6 6 0 0 0 0-10m-2.2 7.2a3 3 0 0 0 0-4.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
      copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9h9v11H9zM6 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>',
      spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
      star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 2.4 4.8 5.3.8-3.8 3.7.9 5.2-4.8-2.5-4.8 2.5.9-5.2L4.3 9.6l5.3-.8z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.8"/></svg>',
    };

    return icons[name] || icons.spark;
  }

  function getModeConfig(mode = DEFAULT_MODE) {
    return MODE_CONFIG[mode] || MODE_CONFIG[DEFAULT_MODE];
  }

  function getCurrentMode() {
    return root.querySelector("#translator-source-mode")?.value || DEFAULT_MODE;
  }

  function renderSourceModeOptions(selectedMode = DEFAULT_MODE) {
    return Object.entries(MODE_CONFIG)
      .map(
        ([value, config]) =>
          `<option value="${value}" ${value === selectedMode ? "selected" : ""}>${config.sourceLabel}</option>`
      )
      .join("");
  }

  function renderSpeakerAccentOptions(mode = DEFAULT_MODE) {
    return getModeConfig(mode).speakerOptions
      .map(
        (option) =>
          `<option value="${option.value}">${option.label}</option>`
      )
      .join("");
  }

  function normalizeResult(result) {
    if (!result) {
      return null;
    }

    if (Array.isArray(result.lineDefinitions) && result.lineDefinitions.length) {
      return result;
    }

    const mode = result.mode || DEFAULT_MODE;
    const config = getModeConfig(mode);

    return {
      ...result,
      mode,
      sourceLabel: result.sourceLabel || config.sourceLabel,
      speakerLang: result.speakerLang || config.speakerOptions[0]?.value || "en-IN",
      primaryText: result.primaryText || result.naturalEnglish || result.basicEnglish || "",
      lineDefinitions: [
        {
          key: "basic",
          label: config.basicLabel,
          value: result.basicEnglish || "",
        },
        {
          key: "natural",
          label: config.naturalLabel,
          value: result.naturalEnglish || result.basicEnglish || "",
        },
        {
          key: "better",
          label: config.betterLabel,
          value: result.betterAlternative || result.naturalEnglish || result.basicEnglish || "",
        },
      ],
    };
  }

  function renderEmptyOutput(mode = DEFAULT_MODE) {
    const config = getModeConfig(mode);

    return `
      <div class="translator-output-panel translator-output-panel--empty">
        <span class="translator-output-badge">Ready to translate</span>
        <p class="translator-output-main">${config.targetTitle}</p>
        <p class="translator-output-support">
          ${config.targetSupport}
        </p>
        <div class="translator-output-stack">
          <div class="translator-output-row">
            <div>
              <span>${config.basicLabel}</span>
              <p>${config.basicPreview}</p>
            </div>
          </div>
          <div class="translator-output-row translator-output-row--primary">
            <div>
              <span>${config.naturalLabel}</span>
              <p>${config.naturalPreview}</p>
            </div>
          </div>
          <div class="translator-output-row">
            <div>
              <span>${config.betterLabel}</span>
              <p>${config.betterPreview}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function formatHistoryTime(value) {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(value));
    } catch (error) {
      return "Recent";
    }
  }

  function renderHistory() {
    if (!translationHistory.length) {
      return `
        <div class="history-empty">
          <strong>No recent translations yet</strong>
          <p>Translate one sentence above and your recent history will appear here automatically.</p>
        </div>
      `;
    }

    return `
      <div class="history-strip">
        ${translationHistory
          .map(
            (rawItem, index) => {
              const item = normalizeResult(rawItem);
              const naturalLine =
                item.lineDefinitions.find((line) => line.key === "natural") || item.lineDefinitions[0];
              const secondaryLine =
                item.lineDefinitions.find((line) => line.key === "better") || item.lineDefinitions[1];

              return `
              <article class="history-card">
                <div class="history-card__meta">
                  <span>${escapeHtml(item.matchLabel || "Recent translation")}</span>
                  <span>${escapeHtml(formatHistoryTime(item.savedAt))}</span>
                </div>
                <strong>${escapeHtml(item.input)}</strong>
                <p><span class="muted">${escapeHtml(naturalLine.label)}:</span> ${escapeHtml(
                  naturalLine.value
                )}</p>
                <p><span class="muted">${escapeHtml(secondaryLine.label)}:</span> ${escapeHtml(
                  secondaryLine.value
                )}</p>
                <div class="history-card__actions">
                  <button class="button button-ghost button-small" type="button" data-history-load="${index}">
                    Open result
                  </button>
                  <button class="speaker-button" type="button" data-history-speak="${index}">
                    Speaker
                  </button>
                </div>
              </article>
            `;
            }
          )
          .join("")}
      </div>
    `;
  }

  function renderOutput(rawResult) {
    const result = normalizeResult(rawResult);
    const favorites = getFavorites();
    const isSaved = result.id ? favorites.includes(result.id) : false;
    const sourceLabel =
      result.provider === "live"
        ? "Live translation"
        : result.provider === "local"
          ? "Phrase bank"
          : "Fallback";
    const outputRows = result.lineDefinitions
      .map(
        (line) => `
          <div class="translator-output-row ${line.key === "natural" ? "translator-output-row--primary" : ""}">
            <div>
              <span>${escapeHtml(line.label)}</span>
              <p>${escapeHtml(line.value)}</p>
            </div>
            <button class="translator-line-speak" type="button" data-speak-segment="${line.key}" aria-label="Speak ${escapeHtml(
              line.label
            )}">
              ${translatorControlIcon("sound")}
            </button>
          </div>
        `
      )
      .join("");

    return `
      <div class="translator-output-panel">
        <div class="translator-output-badges">
          <span class="translator-output-badge">${escapeHtml(result.matchLabel)}</span>
          <span class="translator-output-badge translator-output-badge--soft">${escapeHtml(sourceLabel)}</span>
        </div>
        <p class="translator-output-main">${escapeHtml(result.primaryText)}</p>
        <p class="translator-output-support">${escapeHtml(result.speakingCoach)}</p>
        <div class="translator-output-stack">
          ${outputRows}
        </div>
        <div class="translator-detail-grid">
          <div class="translator-detail-card">
            <span>Original input</span>
            <p>${escapeHtml(result.input)}</p>
          </div>
          <div class="translator-detail-card">
            <span>Confidence</span>
            <p>${result.confidence}% â€¢ ${escapeHtml(result.confidenceNote)}</p>
          </div>
          <div class="translator-detail-card">
            <span>Common mistake</span>
            <p>${escapeHtml(result.commonMistake)}</p>
          </div>
          <div class="translator-detail-card">
            <span>Why this works</span>
            <p>${escapeHtml(result.explanation)}</p>
          </div>
        </div>
        <div class="translator-output-footer">
          <p>${escapeHtml(result.practicePrompt)}</p>
          ${
            result.id
              ? `<button class="translator-save-button" type="button" data-favorite-output>
                  ${translatorControlIcon("star")}
                  <span>${isSaved ? "Saved" : "Save phrase"}</span>
                </button>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderPage() {
    root.innerHTML = `
      <section class="page-hero reveal">
        <div class="translator-hero-grid translator-hero-grid--single">
          <div class="page-hero__copy">
            <span class="eyebrow">Premium translator lab</span>
            <h1>Translate Hindi and English with a cleaner two-way workspace</h1>
            <p>
              Built for learners who want fast Hindi to English speaking help and quick English to Hindi meaning support in one compact translator.
            </p>
            <div class="hero__actions">
              <a class="button button-solid" href="#translator-lab">Open Translator</a>
              <a class="button button-ghost" href="practice.html">Practice Speaking</a>
            </div>
          </div>
        </div>
      </section>

      <section class="translator-layout section reveal" id="translator-lab">
        <div class="section-header">
          <div>
            <span class="eyebrow">Translator workspace</span>
            <h2>Input and output in a compact two-way translation card</h2>
          </div>
          <p>Choose Hindi or English input mode and translate in both directions inside the same cleaner stacked-card layout.</p>
        </div>
        <div class="translator-workbench">
          <div class="translator-device-shell">
            <form class="translator-form translator-form--device" id="translator-form">
              <article class="translator-pane translator-pane--input">
                <div class="translator-pane__toolbar">
                  <div class="translator-tool-row">
                    <button class="translator-tool" type="button" data-voice-input aria-label="Voice input">
                      ${translatorControlIcon("mic")}
                    </button>
                    <button class="translator-tool" type="button" data-clear-input aria-label="Clear input">
                      ${translatorControlIcon("clear")}
                    </button>
                  </div>
                  <select class="translator-language-select" id="translator-source-mode" aria-label="Source language">
                    ${renderSourceModeOptions(DEFAULT_MODE)}
                  </select>
                </div>
                <div class="translator-pane__body">
                  <label class="translator-pane__label" id="translator-input-label" for="translator-input">${getModeConfig(DEFAULT_MODE).inputLabel}</label>
                  <textarea
                    class="translator-pane__textarea"
                    id="translator-input"
                    placeholder="${getModeConfig(DEFAULT_MODE).inputPlaceholder}"
                  ></textarea>
                  <p class="translator-pane__hint" id="translator-input-hint">
                    ${getModeConfig(DEFAULT_MODE).inputHint}
                  </p>
                </div>
              </article>
              <button class="translator-orb" type="submit" data-translate-submit aria-label="Translate sentence">
                <span class="translator-orb__icon">${translatorControlIcon("spark")}</span>
              </button>
              <article class="translator-pane translator-pane--output">
                <div class="translator-pane__toolbar">
                  <select class="translator-language-select" id="speaker-accent" aria-label="Output accent">
                    ${renderSpeakerAccentOptions(DEFAULT_MODE)}
                  </select>
                  <div class="translator-tool-row">
                    <button class="translator-tool" type="button" data-copy-output aria-label="Copy translation">
                      ${translatorControlIcon("copy")}
                    </button>
                    <button class="translator-tool" type="button" data-speak-segment="natural" aria-label="Speak natural English">
                      ${translatorControlIcon("sound")}
                    </button>
                  </div>
                </div>
                <div class="translator-speed-strip">
                  <span>Playback speed</span>
                  <select class="translator-speed-select" id="speaker-speed" aria-label="Playback speed">
                    <option value="1">Normal</option>
                    <option value="0.88">Slow</option>
                    <option value="0.75">Very slow</option>
                  </select>
                </div>
                <div id="translator-output">
                  ${renderEmptyOutput(DEFAULT_MODE)}
                </div>
              </article>
            </form>
          </div>
        </div>

        <div class="grid grid-2">
          <article class="translator-process">
            <span class="badge">Speaking flow</span>
            <h3>Use this 3-step method for better spoken English</h3>
            <ol>
              <li>Write the thought in Hindi or Hinglish without overthinking grammar.</li>
              <li>Compare the basic sentence, natural sentence, and better alternative right next to it.</li>
              <li>Play the speaker, repeat the natural line aloud, then say the fluent upgrade.</li>
            </ol>
          </article>
          <article class="translator-process">
            <span class="badge">Pronunciation tips</span>
            <h3>Use the speaker like a practice coach</h3>
            <ol>
              <li>Choose Indian, American, or British accent depending on your goal.</li>
              <li>Play the natural English sentence once at normal speed.</li>
              <li>Replay the better alternative at slow speed and copy the rhythm aloud.</li>
            </ol>
          </article>
        </div>
      </section>

      <section class="section reveal">
        <div class="section-header">
          <div>
            <span class="eyebrow">Daily Hindi to English switches</span>
            <h2>See how direct translation becomes fluent speech</h2>
          </div>
          <p>Right below this heading, your latest translation history appears first, then you can compare it with the saved example library.</p>
        </div>
        <div class="translator-history-shell">
          <div class="history-shell__head">
            <span class="badge">Recent translation history</span>
            <p>Your latest translated results stay here in this browser.</p>
          </div>
          <div id="translator-history">
            ${renderHistory()}
          </div>
        </div>
        <div class="section-header">
          <div>
            <span class="eyebrow">Phrase library</span>
            <h2>Saved example switches</h2>
          </div>
          <p>Use these examples when you need quick ready-made Hindi to English speaking patterns.</p>
        </div>
        <div class="grid grid-2">
          ${siteData.phrases
            .slice(0, 6)
            .map(
              (phrase) => `
                <article class="translator-example-card">
                  <strong>${escapeHtml(phrase.hindi)}</strong>
                  <p><span class="muted">Basic:</span> ${escapeHtml(phrase.basicEnglish)}</p>
                  <p><span class="muted">Natural:</span> ${escapeHtml(phrase.naturalEnglish)}</p>
                  <p><span class="muted">Fluent upgrade:</span> ${escapeHtml(phrase.betterAlternative)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="section reveal">
        <div class="section-header">
          <div>
            <span class="eyebrow">Pattern lab</span>
            <h2>Practice the same speaking structure again and again</h2>
          </div>
          <p>These patterns help you create many new English sentences without translating every single word.</p>
        </div>
        <div class="grid grid-3">
          ${siteData.practiceTracks[1].items
            .map(
              (item) => `
                <article class="pattern-card">
                  <span class="badge">Speaking pattern</span>
                  <h3>${escapeHtml(item.hindi)}</h3>
                  <p>${escapeHtml(item.english)}</p>
                  <p>Tip: ${escapeHtml(item.tip)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="section reveal">
        <div class="section-header">
          <div>
            <span class="eyebrow">Polite upgrades</span>
            <h2>Small changes that make your English sound smoother</h2>
          </div>
          <a class="inline-link" href="practice.html">Go to full practice library</a>
        </div>
        <div class="grid grid-3">
          ${siteData.phrases
            .slice(4, 10)
            .slice(0, 6)
            .map(
              (phrase) => `
                <article class="card">
                  <div class="card__meta">
                    <strong>${escapeHtml(phrase.hindi)}</strong>
                    <p><span class="muted">Natural:</span> ${escapeHtml(phrase.naturalEnglish)}</p>
                    <p><span class="muted">Better:</span> ${escapeHtml(phrase.betterAlternative)}</p>
                  </div>
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <div class="voice-popup" data-voice-popup hidden>
        <button class="voice-popup__backdrop" type="button" data-voice-close aria-label="Close voice popup"></button>
        <div class="voice-popup__dialog" role="dialog" aria-modal="true" aria-labelledby="voice-popup-title">
          <button class="voice-popup__close" type="button" data-voice-close aria-label="Close voice input">
            ${translatorControlIcon("clear")}
          </button>
          <div class="voice-popup__mic-shell" aria-hidden="true">
            <span class="voice-popup__pulse"></span>
            <div class="voice-popup__mic">
              ${translatorControlIcon("mic")}
            </div>
          </div>
          <p class="voice-popup__title" id="voice-popup-title">Microphone is listening</p>
          <p class="voice-popup__status" data-voice-status>${getModeConfig(DEFAULT_MODE).voicePrompt}</p>
          <p class="voice-popup__transcript" data-voice-live>What you say will appear here live.</p>
        </div>
      </div>
    `;

    const translatorForm = document.getElementById("translator-form");
    const translatorInput = document.getElementById("translator-input");
    const translatorOutput = document.getElementById("translator-output");
    const translatorHistoryMount = document.getElementById("translator-history");
    const translateSubmitButton = root.querySelector("[data-translate-submit]");
    const sourceModeSelect = root.querySelector("#translator-source-mode");
    const speakerAccentSelect = root.querySelector("#speaker-accent");
    const translatorInputLabel = root.querySelector("#translator-input-label");
    const translatorInputHint = root.querySelector("#translator-input-hint");
    const voicePopup = root.querySelector("[data-voice-popup]");
    const voiceStatus = root.querySelector("[data-voice-status]");
    const voiceLive = root.querySelector("[data-voice-live]");
    let activeRecognition = null;
    let voiceBaseInput = "";
    let voiceFinalTranscript = "";
    let voiceHadCapture = false;
    let voiceWasCancelled = false;
    let voiceErrorMessage = "";

    function setTranslateLoading(isLoading) {
      if (!translateSubmitButton) {
        return;
      }

      translateSubmitButton.disabled = isLoading;
      translateSubmitButton.classList.toggle("is-loading", isLoading);
      translateSubmitButton.innerHTML = `<span class="translator-orb__icon">${
        isLoading ? "..." : translatorControlIcon("spark")
      }</span>`;
    }

    function joinVoiceInput(baseText, spokenText) {
      return [baseText.trim(), spokenText.trim()].filter(Boolean).join(" ");
    }

    function syncModeUI(mode, options = {}) {
      const {
        preserveOutput = false,
        preserveInput = true,
        silent = true,
      } = options;
      const config = getModeConfig(mode);

      if (sourceModeSelect) {
        sourceModeSelect.value = mode;
      }

      if (speakerAccentSelect) {
        speakerAccentSelect.innerHTML = renderSpeakerAccentOptions(mode);
      }

      if (translatorInputLabel) {
        translatorInputLabel.textContent = config.inputLabel;
      }

      if (translatorInput) {
        translatorInput.placeholder = config.inputPlaceholder;
        if (!preserveInput) {
          translatorInput.value = "";
        }
      }

      if (translatorInputHint) {
        translatorInputHint.textContent = config.inputHint;
      }

      if (!preserveOutput) {
        latestResult = null;
        translatorOutput.innerHTML = renderEmptyOutput(mode);
      }

      if (!silent) {
        showToast(`${config.sourceLabel} mode selected.`);
      }
    }

    function resetVoicePopup() {
      if (!voiceStatus || !voiceLive) {
        return;
      }

      voiceStatus.textContent = getModeConfig(getCurrentMode()).voicePrompt;
      voiceLive.textContent = "What you say will appear here live.";
    }

    function openVoicePopup() {
      if (!voicePopup) {
        return;
      }

      resetVoicePopup();
      voicePopup.hidden = false;
      document.body.classList.add("voice-popup-open");
    }

    function closeVoicePopup() {
      if (!voicePopup) {
        return;
      }

      voicePopup.hidden = true;
      document.body.classList.remove("voice-popup-open");
      resetVoicePopup();
    }

    function finishVoiceSession() {
      const shouldShowSuccess = !voiceWasCancelled && !voiceErrorMessage && voiceHadCapture;
      const shouldShowEmptyError = !voiceWasCancelled && !voiceErrorMessage && !voiceHadCapture;

      activeRecognition = null;
      voiceBaseInput = "";
      voiceFinalTranscript = "";
      voiceHadCapture = false;
      voiceWasCancelled = false;
      voiceErrorMessage = "";
      closeVoicePopup();

      if (shouldShowSuccess) {
        showToast("Voice input added.");
      } else if (shouldShowEmptyError) {
        showToast("No speech detected. Please try again.", "error");
      }
    }

    function stopVoiceRecognition(shouldAbort = true) {
      if (!activeRecognition) {
        closeVoicePopup();
        return;
      }

      voiceWasCancelled = true;

      if (shouldAbort && typeof activeRecognition.abort === "function") {
        activeRecognition.abort();
        return;
      }

      activeRecognition.stop();
    }

    function getSpeakerSettings() {
      const mode = latestResult?.mode || getCurrentMode();
      const fallbackLang = getModeConfig(mode).speakerOptions[0]?.value || "en-IN";

      return {
        lang: root.querySelector("#speaker-accent")?.value || fallbackLang,
        rate: Number(root.querySelector("#speaker-speed")?.value || 1),
      };
    }

    function resolveVoice(lang) {
      if (!("speechSynthesis" in window)) {
        return null;
      }

      const voices = window.speechSynthesis.getVoices();
      const normalized = lang.toLowerCase();

      return (
        voices.find((voice) => voice.lang.toLowerCase() === normalized) ||
        voices.find((voice) => voice.lang.toLowerCase().startsWith(normalized.split("-")[0])) ||
        null
      );
    }

    function speakText(text, langOverride = "") {
      if (!("speechSynthesis" in window)) {
        showToast("Speech playback is not supported in this browser.", "error");
        return;
      }

      const settings = getSpeakerSettings();
      const utterance = new SpeechSynthesisUtterance(text);
      const resolvedLang = langOverride || settings.lang;
      const selectedVoice = resolveVoice(resolvedLang);

      utterance.lang = resolvedLang;
      utterance.rate = settings.rate;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    function updateHistory() {
      translationHistory = getTranslationHistory(currentUser.id);
      translatorHistoryMount.innerHTML = renderHistory();
      bindHistoryActions();
    }

    function bindHistoryActions() {
      root.querySelectorAll("[data-history-load]").forEach((button) => {
        button.addEventListener("click", () => {
          const item = normalizeResult(
            translationHistory[Number(button.getAttribute("data-history-load"))]
          );

          if (!item) {
            return;
          }

          syncModeUI(item.mode || DEFAULT_MODE, {
            preserveOutput: true,
            preserveInput: true,
          });
          translatorInput.value = item.input;
          latestResult = item;
          translatorOutput.innerHTML = renderOutput(item);
          bindOutputActions();
          showToast("Recent translation loaded.");
        });
      });

      root.querySelectorAll("[data-history-speak]").forEach((button) => {
        button.addEventListener("click", () => {
          const item = normalizeResult(
            translationHistory[Number(button.getAttribute("data-history-speak"))]
          );

          if (!item) {
            return;
          }

          speakText(item.primaryText, item.speakerLang);
        });
      });
    }

    function bindOutputActions() {
      root.querySelectorAll("[data-copy-output]").forEach((button) => {
        if (button.dataset.bound === "true") {
          return;
        }

        button.dataset.bound = "true";
        button.addEventListener("click", async () => {
          if (!latestResult) {
            showToast("Translate a sentence first.", "error");
            return;
          }

          const result = normalizeResult(latestResult);
          const textToCopy = [
            `${result.sourceLabel} Input: ${result.input}`,
            ...result.lineDefinitions.map((line) => `${line.label}: ${line.value}`),
            `Practice Prompt: ${result.practicePrompt}`,
          ].join("\n");

          try {
            await navigator.clipboard.writeText(textToCopy);
            showToast("Translation copied.");
          } catch (error) {
            showToast("Copy is not available in this browser.", "error");
          }
        });
      });

      root.querySelectorAll("[data-speak-segment]").forEach((button) => {
        if (button.dataset.bound === "true") {
          return;
        }

        button.dataset.bound = "true";
        button.addEventListener("click", () => {
          if (!latestResult) {
            showToast("Translate a sentence first.", "error");
            return;
          }

          const result = normalizeResult(latestResult);
          const segment = button.getAttribute("data-speak-segment");
          const segmentMap = Object.fromEntries(
            result.lineDefinitions.map((line) => [line.key, line.value])
          );

          speakText(segmentMap[segment] || result.primaryText, result.speakerLang);
        });
      });

      const favoriteButton = root.querySelector("[data-favorite-output]");

      if (favoriteButton && latestResult?.id && favoriteButton.dataset.bound !== "true") {
        favoriteButton.dataset.bound = "true";
        favoriteButton.addEventListener("click", () => {
          toggleFavoritePhrase(latestResult.id);
          translatorOutput.innerHTML = renderOutput(latestResult);
          bindOutputActions();
          showToast("Phrase favorites updated.");
        });
      }
    }

    function showResult(result, shouldSaveHistory = false) {
      latestResult = normalizeResult({
        ...result,
        savedAt: result.savedAt || new Date().toISOString(),
      });

      translatorOutput.innerHTML = renderOutput(latestResult);
      bindOutputActions();

      if (shouldSaveHistory) {
        pushTranslationHistory(currentUser.id, latestResult);
        updateHistory();
      }
    }

    translatorForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const inputValue = translatorInput.value.trim();
      const currentMode = getCurrentMode();
      const currentConfig = getModeConfig(currentMode);

      if (!inputValue) {
        showToast(`Please enter a ${currentConfig.sourceLabel.toLowerCase()} sentence first.`, "error");
        return;
      }

      setTranslateLoading(true);

      try {
        incrementTranslatorSearches();
        const result = await translateText(inputValue, siteData, currentMode);
        showResult(result, true);
        const targetName = currentMode === "en-to-hi" ? "Hindi" : "English";
        const statusMap = {
          live: {
            message: `${targetName} translation loaded.`,
            tone: "success",
          },
          local: {
            message: "Live service was unavailable, so the saved phrase bank was used.",
            tone: "success",
          },
          fallback: {
            message: "Live service was unavailable. Fallback guidance shown.",
            tone: "error",
          },
        };
        const status = statusMap[result.provider] || statusMap.fallback;
        showToast(status.message, status.tone);
      } finally {
        setTranslateLoading(false);
      }
    });

    root.querySelector("[data-clear-input]").addEventListener("click", () => {
      translatorInput.value = "";
      latestResult = null;
      translatorOutput.innerHTML = renderEmptyOutput(getCurrentMode());
      showToast("Translator cleared.");
    });

    sourceModeSelect?.addEventListener("change", () => {
      if (activeRecognition) {
        stopVoiceRecognition(true);
      }

      syncModeUI(sourceModeSelect.value, {
        preserveOutput: false,
        preserveInput: true,
        silent: false,
      });
    });

    root.querySelectorAll("[data-voice-close]").forEach((button) => {
      button.addEventListener("click", () => {
        stopVoiceRecognition(true);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && voicePopup && !voicePopup.hidden) {
        stopVoiceRecognition(true);
      }
    });

    root.querySelector("[data-voice-input]").addEventListener("click", () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        showToast("Voice input is not available in this browser.", "error");
        return;
      }

      if (activeRecognition) {
        return;
      }

      openVoicePopup();
      voiceBaseInput = translatorInput.value;
      voiceFinalTranscript = "";
      voiceHadCapture = false;
      voiceWasCancelled = false;
      voiceErrorMessage = "";

      const recognition = new SpeechRecognition();
      activeRecognition = recognition;
      recognition.lang = getModeConfig(getCurrentMode()).voiceRecognitionLang;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        voiceStatus.textContent = "Listening live";
        voiceLive.textContent = "Speak now...";
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcriptPiece = event.results[index][0].transcript.trim();

          if (!transcriptPiece) {
            continue;
          }

          if (event.results[index].isFinal) {
            voiceFinalTranscript = `${voiceFinalTranscript} ${transcriptPiece}`.trim();
          } else {
            interimTranscript = `${interimTranscript} ${transcriptPiece}`.trim();
          }
        }

        const liveTranscript = [voiceFinalTranscript, interimTranscript].filter(Boolean).join(" ").trim();
        voiceHadCapture = Boolean(liveTranscript);
        voiceStatus.textContent = "Listening live";
        voiceLive.textContent = liveTranscript || "Listening...";
        translatorInput.value = joinVoiceInput(voiceBaseInput, liveTranscript);
      };

      recognition.onerror = (event) => {
        const messageMap = {
          "audio-capture": "Microphone is not available on this device.",
          "network": "Network issue while capturing voice input.",
          "no-speech": "No speech detected. Please try again.",
          "not-allowed": "Microphone permission was blocked.",
          "service-not-allowed": "Microphone access is not allowed in this browser.",
        };

        if (event.error === "aborted" && voiceWasCancelled) {
          return;
        }

        voiceErrorMessage = messageMap[event.error] || "Voice input could not capture your sentence.";
        voiceStatus.textContent = "Microphone stopped";
        voiceLive.textContent = voiceErrorMessage;
        showToast(voiceErrorMessage, "error");
      };

      recognition.onend = () => {
        finishVoiceSession();
      };

      try {
        recognition.start();
      } catch (error) {
        activeRecognition = null;
        voiceBaseInput = "";
        voiceFinalTranscript = "";
        voiceHadCapture = false;
        voiceWasCancelled = false;
        voiceErrorMessage = "";
        closeVoicePopup();
        showToast("Voice input could not start in this browser.", "error");
      }
    });

    syncModeUI(DEFAULT_MODE, {
      preserveOutput: false,
      preserveInput: true,
    });
    bindOutputActions();
    updateHistory();
  }

  renderPage();
  refreshReveal();
});
