import { defaultSiteData } from "./data.js";

const SITE_DATA_KEY = "spokenEnglishSiteData.v3";
const LEGACY_SITE_DATA_KEYS = ["spokenEnglishSiteData.v2"];
const USERS_KEY = "spokenEnglishUsers.v1";
const TRANSLATOR_SEARCHES_KEY = "spokenEnglishTranslatorSearches.v1";
const THEME_KEY = "spokenEnglishTheme.v1";
const CURRENT_USER_KEY = "spokenEnglishCurrentUser.v1";
const SESSION_USER_KEY = "spokenEnglishSessionUser.v1";
const ADMIN_SESSION_KEY = "spokenEnglishAdminSession.v1";
const PRACTICE_PROGRESS_KEY = "spokenEnglishPracticeProgress.v1";
const FAVORITES_KEY = "spokenEnglishFavoritePhrases.v1";
const TRANSLATION_HISTORY_KEY = "spokenEnglishTranslationHistory.v1";
const SPEAKING_PRACTICE_RESPONSES_KEY = "spokenEnglishSpeakingPracticeResponses.v1";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(key, fallbackValue) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : clone(fallbackValue);
  } catch (error) {
    return clone(fallbackValue);
  }
}

function readOptionalJson(key) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    return null;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function mergeObjects(defaultValue, savedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(savedValue) ? savedValue : clone(defaultValue);
  }

  if (
    defaultValue &&
    typeof defaultValue === "object" &&
    savedValue &&
    typeof savedValue === "object"
  ) {
    const merged = { ...clone(defaultValue) };

    Object.keys(savedValue).forEach((key) => {
      if (key in merged) {
        merged[key] = mergeObjects(merged[key], savedValue[key]);
      } else {
        merged[key] = savedValue[key];
      }
    });

    return merged;
  }

  return savedValue ?? defaultValue;
}

export function getSiteData() {
  const currentData = readOptionalJson(SITE_DATA_KEY);

  if (currentData) {
    return mergeObjects(defaultSiteData, currentData);
  }

  const legacyData = LEGACY_SITE_DATA_KEYS.map((key) => readOptionalJson(key)).find(
    (value) => value && typeof value === "object"
  );

  if (legacyData) {
    const migratedData = mergeObjects(defaultSiteData, legacyData);
    migratedData.schemaVersion = defaultSiteData.schemaVersion;
    migratedData.brand = clone(defaultSiteData.brand);
    saveSiteData(migratedData);
    return migratedData;
  }

  return clone(defaultSiteData);
}

export function saveSiteData(siteData) {
  writeJson(SITE_DATA_KEY, siteData);
}

export function resetSiteData() {
  saveSiteData(clone(defaultSiteData));
}

export function getUsers() {
  return readJson(USERS_KEY, []);
}

export function saveUsers(users) {
  writeJson(USERS_KEY, users);
}

export function registerUser(formData) {
  const users = getUsers();
  const alreadyExists = users.some(
    (user) =>
      user.email.toLowerCase() === formData.email.toLowerCase() ||
      user.mobile === formData.mobile
  );

  if (alreadyExists) {
    return {
      ok: false,
      message: "An account with this email or mobile number already exists.",
    };
  }

  const newUser = {
    id: `user-${Date.now()}`,
    fullName: formData.fullName,
    email: formData.email,
    mobile: formData.mobile,
    password: formData.password,
    level: formData.level || "Beginner",
    avatarDataUrl: formData.avatarDataUrl || "",
    joinedAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return {
    ok: true,
    user: newUser,
  };
}

export function authenticateUser(identifier, password) {
  const users = getUsers();
  const match = users.find((user) => {
    const emailMatch = user.email.toLowerCase() === identifier.toLowerCase();
    const nameMatch = user.fullName.toLowerCase() === identifier.toLowerCase();
    return (emailMatch || nameMatch) && user.password === password;
  });

  if (!match) {
    return {
      ok: false,
      message: "No matching learner account was found. Please check your details.",
    };
  }

  return {
    ok: true,
    user: match,
  };
}

export function setCurrentUser(user, remember = true) {
  const payload = JSON.stringify(user);

  if (remember) {
    localStorage.setItem(CURRENT_USER_KEY, payload);
    sessionStorage.removeItem(SESSION_USER_KEY);
  } else {
    sessionStorage.setItem(SESSION_USER_KEY, payload);
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getCurrentUser() {
  try {
    const sessionUser = sessionStorage.getItem(SESSION_USER_KEY);
    if (sessionUser) {
      return JSON.parse(sessionUser);
    }

    const persistedUser = localStorage.getItem(CURRENT_USER_KEY);
    return persistedUser ? JSON.parse(persistedUser) : null;
  } catch (error) {
    return null;
  }
}

export function logoutCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
}

function syncStoredCurrentUser(updatedUser) {
  try {
    const localUser = localStorage.getItem(CURRENT_USER_KEY);
    if (localUser) {
      const parsedLocalUser = JSON.parse(localUser);
      if (parsedLocalUser?.id === updatedUser.id) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
    }
  } catch (error) {}

  try {
    const sessionUser = sessionStorage.getItem(SESSION_USER_KEY);
    if (sessionUser) {
      const parsedSessionUser = JSON.parse(sessionUser);
      if (parsedSessionUser?.id === updatedUser.id) {
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
      }
    }
  } catch (error) {}
}

export function updateUserProfile(userId, updates) {
  if (!userId || !updates || typeof updates !== "object") {
    return {
      ok: false,
      message: "Profile update data is missing.",
    };
  }

  const users = getUsers();
  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex < 0) {
    return {
      ok: false,
      message: "User profile was not found.",
    };
  }

  const currentUser = users[userIndex];
  const nextEmail = String(updates.email ?? currentUser.email).trim();
  const nextMobile = String(updates.mobile ?? currentUser.mobile).trim();

  const duplicateUser = users.find(
    (user) =>
      user.id !== userId &&
      (user.email.toLowerCase() === nextEmail.toLowerCase() || user.mobile === nextMobile)
  );

  if (duplicateUser) {
    return {
      ok: false,
      message: "Another account already uses this email or mobile number.",
    };
  }

  const updatedUser = {
    ...currentUser,
    fullName: String(updates.fullName ?? currentUser.fullName).trim(),
    email: nextEmail,
    mobile: nextMobile,
    level: String(updates.level ?? (currentUser.level || "Beginner")),
    avatarDataUrl: String(updates.avatarDataUrl ?? (currentUser.avatarDataUrl || "")),
  };

  users[userIndex] = updatedUser;
  saveUsers(users);
  syncStoredCurrentUser(updatedUser);

  return {
    ok: true,
    user: updatedUser,
  };
}

export function getTranslatorSearches() {
  return Number(localStorage.getItem(TRANSLATOR_SEARCHES_KEY) || 0);
}

export function incrementTranslatorSearches() {
  const nextValue = getTranslatorSearches() + 1;
  localStorage.setItem(TRANSLATOR_SEARCHES_KEY, String(nextValue));
  return nextValue;
}

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

export function setStoredTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function setAdminLoggedIn(value) {
  localStorage.setItem(ADMIN_SESSION_KEY, value ? "true" : "false");
}

export function getPracticeProgress() {
  return readJson(PRACTICE_PROGRESS_KEY, {});
}

export function togglePracticeItem(itemId) {
  const progress = getPracticeProgress();
  progress[itemId] = !progress[itemId];
  writeJson(PRACTICE_PROGRESS_KEY, progress);
  return progress;
}

export function getSpeakingPracticeResponses(userId) {
  const responseMap = readJson(SPEAKING_PRACTICE_RESPONSES_KEY, {});

  if (!userId) {
    return {};
  }

  const userResponses = responseMap[userId];
  return userResponses && typeof userResponses === "object" ? userResponses : {};
}

export function saveSpeakingPracticeResponse(userId, questionId, answer) {
  if (!userId || !questionId) {
    return {};
  }

  const responseMap = readJson(SPEAKING_PRACTICE_RESPONSES_KEY, {});
  const userResponses =
    responseMap[userId] && typeof responseMap[userId] === "object"
      ? responseMap[userId]
      : {};

  userResponses[questionId] = {
    answer,
    savedAt: new Date().toISOString(),
  };

  responseMap[userId] = userResponses;
  writeJson(SPEAKING_PRACTICE_RESPONSES_KEY, responseMap);
  return userResponses;
}

export function getFavorites() {
  return readJson(FAVORITES_KEY, []);
}

export function toggleFavoritePhrase(phraseId) {
  const favorites = getFavorites();
  const hasFavorite = favorites.includes(phraseId);
  const nextFavorites = hasFavorite
    ? favorites.filter((item) => item !== phraseId)
    : [...favorites, phraseId];

  writeJson(FAVORITES_KEY, nextFavorites);
  return nextFavorites;
}

export function getTranslationHistory(userId) {
  const historyMap = readJson(TRANSLATION_HISTORY_KEY, {});

  if (!userId) {
    return [];
  }

  const history = historyMap[userId];
  return Array.isArray(history) ? history : [];
}

export function pushTranslationHistory(userId, entry) {
  if (!userId || !entry) {
    return [];
  }

  const historyMap = readJson(TRANSLATION_HISTORY_KEY, {});
  const currentHistory = Array.isArray(historyMap[userId]) ? historyMap[userId] : [];
  const normalizedInput = String(entry.input || "").trim().toLowerCase();
  const nextHistory = [
    {
      ...entry,
      savedAt: entry.savedAt || new Date().toISOString(),
    },
    ...currentHistory.filter(
      (item) => String(item.input || "").trim().toLowerCase() !== normalizedInput
    ),
  ].slice(0, 6);

  historyMap[userId] = nextHistory;
  writeJson(TRANSLATION_HISTORY_KEY, historyMap);
  return nextHistory;
}

export function getWordOfTheDay() {
  const siteData = getSiteData();
  const index = new Date().getDate() % siteData.wordBank.length;
  return siteData.wordBank[index];
}

export function getPhraseOfTheDay() {
  const siteData = getSiteData();
  const index = new Date().getDate() % siteData.phrases.length;
  return siteData.phrases[index];
}

export function getDailyChallenge() {
  const siteData = getSiteData();
  const index = new Date().getDate() % siteData.dailyChallenges.length;
  return siteData.dailyChallenges[index];
}
