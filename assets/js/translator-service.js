const TRANSLATION_MODES = {
  "hi-to-en": {
    targetLanguage: "en",
    sourceLanguage: "auto",
    speakerLang: "en-IN",
    sourceLabel: "Hindi / Hinglish",
    targetLabel: "English",
    basicLabel: "Basic English",
    naturalLabel: "Natural English",
    betterLabel: "Better Alternative",
    emptyTitle: "Your English result will appear here.",
    emptySupport: "Type a full Hindi or Hinglish sentence above and tap the center translate button.",
    emptyBasic: "Clean translation preview",
    emptyNatural: "Fluent spoken version preview",
    emptyBetter: "Smoother upgrade preview",
  },
  "en-to-hi": {
    targetLanguage: "hi",
    sourceLanguage: "en",
    speakerLang: "hi-IN",
    sourceLabel: "English",
    targetLabel: "Hindi",
    basicLabel: "Basic Hindi",
    naturalLabel: "Natural Hindi",
    betterLabel: "Easy Hindi Meaning",
    emptyTitle: "Your Hindi result will appear here.",
    emptySupport: "Type a full English sentence above and tap the center translate button.",
    emptyBasic: "Direct Hindi translation preview",
    emptyNatural: "Natural Hindi preview",
    emptyBetter: "Easy meaning preview",
  },
};

function normalizeInput(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, " ")
    .replace(/\bmai\b/g, "main")
    .replace(/\bme\b/g, "main")
    .replace(/\bbolne mein\b/g, "bolne me")
    .replace(/\bmien\b/g, "me")
    .replace(/\bja rha\b/g, "ja raha")
    .replace(/\bkar rha\b/g, "kar raha")
    .replace(/\bbahot\b/g, "bahut")
    .replace(/\bkosis\b/g, "koshish")
    .replace(/\s+/g, " ");
}

function tokenScore(inputValue, compareValue) {
  const inputTokens = new Set(normalizeInput(inputValue).split(" ").filter(Boolean));
  const compareTokens = new Set(normalizeInput(compareValue).split(" ").filter(Boolean));
  const overlap = [...compareTokens].filter((token) => inputTokens.has(token)).length;
  const denominator = Math.max(compareTokens.size, 1);
  let score = overlap / denominator;

  if (
    normalizeInput(inputValue).includes(normalizeInput(compareValue)) ||
    normalizeInput(compareValue).includes(normalizeInput(inputValue))
  ) {
    score += 0.25;
  }

  return score;
}

function getModeConfig(mode = "hi-to-en") {
  return TRANSLATION_MODES[mode] || TRANSLATION_MODES["hi-to-en"];
}

function cleanSentence(text) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "";
  }

  const withCapital = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(withCapital) ? withCapital : `${withCapital}.`;
}

function cleanHindiSentenceLegacy(text) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return "";
  }

  return /[.!?à¥¤]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function makeSpokenEnglish(text) {
  let spoken = cleanSentence(text);

  const contractions = [
    [/\bI am\b/gi, "I'm"],
    [/\bYou are\b/gi, "You're"],
    [/\bWe are\b/gi, "We're"],
    [/\bThey are\b/gi, "They're"],
    [/\bHe is\b/gi, "He's"],
    [/\bShe is\b/gi, "She's"],
    [/\bIt is\b/gi, "It's"],
    [/\bThat is\b/gi, "That's"],
    [/\bThere is\b/gi, "There's"],
    [/\bDo not\b/gi, "Don't"],
    [/\bDoes not\b/gi, "Doesn't"],
    [/\bDid not\b/gi, "Didn't"],
    [/\bCannot\b/gi, "Can't"],
    [/\bI will\b/gi, "I'll"],
    [/\bI have\b/gi, "I've"],
  ];

  contractions.forEach(([pattern, replacement]) => {
    spoken = spoken.replace(pattern, replacement);
  });

  return spoken;
}

function findHindiPhraseMatch(siteData, inputValue) {
  const rawValue = normalizeInput(inputValue);

  for (const phrase of siteData.phrases) {
    const variants = [phrase.hindi, ...(phrase.variants || [])];
    if (variants.some((item) => normalizeInput(item) === rawValue)) {
      return { phrase, score: 1, exact: true };
    }
  }

  const scored = siteData.phrases
    .map((phrase) => {
      const variants = [phrase.hindi, ...(phrase.variants || [])];
      const bestScore = Math.max(...variants.map((item) => tokenScore(inputValue, item)));
      return { phrase, score: bestScore, exact: false };
    })
    .sort((left, right) => right.score - left.score);

  return scored[0] && scored[0].score >= 0.45 ? scored[0] : null;
}

function findEnglishPhraseMatch(siteData, inputValue) {
  const rawValue = normalizeInput(inputValue);

  for (const phrase of siteData.phrases) {
    const variants = [
      phrase.basicEnglish,
      phrase.naturalEnglish,
      phrase.betterAlternative,
      ...(phrase.englishVariants || []),
    ].filter(Boolean);

    if (variants.some((item) => normalizeInput(item) === rawValue)) {
      return { phrase, score: 1, exact: true };
    }
  }

  const scored = siteData.phrases
    .map((phrase) => {
      const variants = [
        phrase.basicEnglish,
        phrase.naturalEnglish,
        phrase.betterAlternative,
        ...(phrase.englishVariants || []),
      ].filter(Boolean);
      const bestScore = Math.max(...variants.map((item) => tokenScore(inputValue, item)));
      return { phrase, score: bestScore, exact: false };
    })
    .sort((left, right) => right.score - left.score);

  return scored[0] && scored[0].score >= 0.45 ? scored[0] : null;
}

function createLineDefinitionsLegacy(mode, values) {
  const config = getModeConfig(mode);
  return [
    { key: "basic", label: config.basicLabel, value: values.basic },
    { key: "natural", label: config.naturalLabel, value: values.natural },
    { key: "better", label: config.betterLabel, value: values.better },
  ];
}

function normalizeResultShape(result, mode, provider) {
  const config = getModeConfig(mode);
  const lineDefinitions = createLineDefinitions(mode, {
    basic: result.basicOutput,
    natural: result.naturalOutput,
    better: result.betterOutput,
  });

  return {
    ...result,
    mode,
    provider,
    sourceLabel: config.sourceLabel,
    targetLabel: config.targetLabel,
    speakerLang: config.speakerLang,
    primaryText: result.primaryText || result.naturalOutput,
    lineDefinitions,
    basicEnglish: result.basicOutput,
    naturalEnglish: result.naturalOutput,
    betterAlternative: result.betterOutput,
  };
}

function buildFallbackResult(inputValue, mode, matchedPhrase = null) {
  const config = getModeConfig(mode);

  if (matchedPhrase) {
    const confidence = matchedPhrase.exact
      ? 98
      : Math.max(68, Math.min(92, Math.round(matchedPhrase.score * 100)));

    if (mode === "en-to-hi") {
      const translatedHindi = cleanHindiSentence(matchedPhrase.phrase.hindi);
      const alternativeHindi = cleanHindiSentence(
        matchedPhrase.phrase.variants?.[0] || matchedPhrase.phrase.hindi
      );

      return normalizeResultShape(
        {
          id: matchedPhrase.phrase.id,
          input: inputValue,
          basicOutput: translatedHindi,
          naturalOutput: translatedHindi,
          betterOutput: alternativeHindi,
          primaryText: translatedHindi,
          explanation:
            "This Hindi meaning was matched from the saved phrase library, so you can use it even when live translation is unavailable.",
          commonMistake:
            "Read the whole English sentence first, then understand the full Hindi meaning instead of translating word by word.",
          confidence,
          matchLabel: matchedPhrase.exact ? "Strong saved phrase match" : "Closest phrase-bank match",
          confidenceNote: matchedPhrase.exact
            ? "Matched from the saved phrase library"
            : "Best reverse match from saved examples",
          speakingCoach:
            "Read the Hindi line once for meaning, then switch back to the English sentence to remember the pattern.",
          practicePrompt: `Read this Hindi meaning three times: "${translatedHindi}".`,
        },
        mode,
        "local"
      );
    }

    return normalizeResultShape(
      {
        id: matchedPhrase.phrase.id,
        input: inputValue,
        basicOutput: matchedPhrase.phrase.basicEnglish,
        naturalOutput: matchedPhrase.phrase.naturalEnglish,
        betterOutput: matchedPhrase.phrase.betterAlternative,
        primaryText: matchedPhrase.phrase.naturalEnglish,
        explanation: matchedPhrase.phrase.explanation,
        commonMistake: matchedPhrase.phrase.commonMistake,
        confidence,
        matchLabel: matchedPhrase.exact ? "Strong saved phrase match" : "Closest phrase-bank match",
        confidenceNote: matchedPhrase.exact
          ? "Matched from the spoken phrase library"
          : "Best match from saved examples",
        speakingCoach: matchedPhrase.exact
          ? "Repeat the natural version first, then switch to the better alternative for smoother spoken delivery."
          : "This line comes from the closest saved spoken example. Practice it aloud and then make your own variation.",
        practicePrompt: `Say this three times: "${matchedPhrase.phrase.naturalEnglish}" and then try "${matchedPhrase.phrase.betterAlternative}".`,
      },
      mode,
      "local"
    );
  }

  if (mode === "en-to-hi") {
    return normalizeResultShape(
      {
        id: null,
        input: inputValue,
        basicOutput:
          "Live Hindi translation could not be fetched right now, and no close saved phrase was found for this line.",
        naturalOutput:
          "Please try again with a working internet connection, or enter a shorter English sentence.",
        betterOutput:
          "You can also expand the phrase bank later with common English to Hindi examples for offline matching.",
        primaryText: "Please try a shorter English sentence for Hindi translation.",
        explanation:
          "This translator tries a live web translation first and falls back to the built-in phrase bank when the network service is unavailable.",
        commonMistake:
          "Do not depend only on single words. Read the whole English sentence and then understand the complete Hindi meaning.",
        confidence: 32,
        matchLabel: "Fallback guidance",
        confidenceNote: "Live service unavailable",
        speakingCoach:
          "Try a simpler English sentence, then listen to the Hindi result once the live translation is available.",
        practicePrompt:
          "Choose one short English line and try translating the full meaning instead of each word separately.",
      },
      mode,
      "fallback"
    );
  }

  return normalizeResultShape(
    {
      id: null,
      input: inputValue,
      basicOutput:
        "A live translation could not be fetched right now, and no exact saved phrase was found for this line.",
      naturalOutput:
        "Please try again with an internet connection, or use a simpler sentence for the local phrase bank.",
      betterOutput:
        "You can also connect your own translator API or serverless proxy later for broader coverage.",
      primaryText: "Please try again with a simpler Hindi or Hinglish sentence.",
      explanation:
        "This translator now tries a live web translation first and falls back to the built-in phrase bank when the network service is unavailable.",
      commonMistake:
        "Avoid translating word by word from Hindi. Translate the whole idea and then practice the complete English line.",
      confidence: 32,
      matchLabel: "Fallback guidance",
      confidenceNote: "Live service unavailable",
      speakingCoach:
        "Try a shorter sentence or choose one of the saved examples below, then repeat the spoken version aloud.",
      practicePrompt:
        "Use one saved phrase from the example library and create one similar sentence of your own.",
    },
    mode,
    "fallback"
  );
}

async function fetchGoogleStyleTranslationLegacy(inputValue, mode) {
  const config = getModeConfig(mode);
  const endpoint = new URL("https://translate.googleapis.com/translate_a/single");
  endpoint.searchParams.set("client", "gtx");
  endpoint.searchParams.set("sl", config.sourceLanguage);
  endpoint.searchParams.set("tl", config.targetLanguage);
  endpoint.searchParams.set("dt", "t");
  endpoint.searchParams.set("dj", "1");
  endpoint.searchParams.set("q", inputValue);

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Live translation request failed with ${response.status}`);
  }

  const payload = await response.json();
  const translatedText = Array.isArray(payload.sentences)
    ? payload.sentences.map((sentence) => sentence.trans || "").join(" ").trim()
    : "";

  if (!translatedText) {
    throw new Error("Live translation response did not include translated text.");
  }

  return {
    translatedText,
    sourceLanguage: payload.src || config.sourceLanguage || "auto",
  };
}

function buildLiveResultLegacy(inputValue, liveTranslation, mode, matchedPhrase = null) {
  if (mode === "en-to-hi") {
    const directHindi = cleanHindiSentence(liveTranslation.translatedText);
    const matchedHindi = matchedPhrase?.phrase?.hindi
      ? cleanHindiSentence(matchedPhrase.phrase.hindi)
      : directHindi;
    const easyMeaning = cleanHindiSentence(
      matchedPhrase?.phrase?.variants?.[0] || matchedPhrase?.phrase?.hindi || directHindi
    );

    return normalizeResultShape(
      {
        id: matchedPhrase?.exact ? matchedPhrase.phrase.id : null,
        input: inputValue,
        basicOutput: directHindi,
        naturalOutput: matchedPhrase?.exact ? matchedHindi : directHindi,
        betterOutput: matchedPhrase?.exact ? easyMeaning : directHindi,
        primaryText: matchedPhrase?.exact ? matchedHindi : directHindi,
        explanation:
          matchedPhrase?.exact
            ? "The live Hindi translation was aligned with a saved phrase-bank match so the meaning stays natural."
            : "The Hindi line comes from a live translation engine so you can quickly understand the full meaning of the English sentence.",
        commonMistake:
          matchedPhrase?.exact
            ? "Use the Hindi meaning to understand the sentence, then return to the original English line for practice."
            : "Do not translate only key words. Read the complete Hindi meaning as one full sentence.",
        confidence: matchedPhrase?.exact ? 99 : 96,
        matchLabel: matchedPhrase?.exact
          ? "Live translation + phrase match"
          : "Live translation",
        confidenceNote: matchedPhrase?.exact
          ? "Translated live and aligned with a saved Hindi phrase"
          : `Live translation fetched (${String(liveTranslation.sourceLanguage).toUpperCase()} detected)`,
        speakingCoach:
          matchedPhrase?.exact
            ? "Read the Hindi meaning once, then practice the original English line again so you remember both meaning and usage."
            : "Use the Hindi output to understand meaning quickly, then replay it if you want to hear the sentence clearly.",
        practicePrompt:
          matchedPhrase?.exact
            ? `Read this Hindi meaning three times: "${matchedHindi}".`
            : `Read this Hindi sentence aloud three times: "${directHindi}".`,
      },
      mode,
      "live"
    );
  }

  const basicEnglish = cleanSentence(liveTranslation.translatedText);
  const naturalEnglish =
    matchedPhrase && matchedPhrase.exact
      ? matchedPhrase.phrase.naturalEnglish
      : makeSpokenEnglish(liveTranslation.translatedText);
  const betterAlternative =
    matchedPhrase && matchedPhrase.exact
      ? matchedPhrase.phrase.betterAlternative
      : naturalEnglish;

  return normalizeResultShape(
    {
      id: matchedPhrase?.exact ? matchedPhrase.phrase.id : null,
      input: inputValue,
      basicOutput: basicEnglish,
      naturalOutput: naturalEnglish,
      betterOutput: betterAlternative,
      primaryText: naturalEnglish,
      explanation:
        matchedPhrase && matchedPhrase.exact
          ? matchedPhrase.phrase.explanation
          : "The basic line comes from a live translation engine. The spoken version applies common contractions so it sounds more natural in conversation.",
      commonMistake:
        matchedPhrase && matchedPhrase.exact
          ? matchedPhrase.phrase.commonMistake
          : "Do not split the sentence word by word. Learn the full English line as one spoken idea.",
      confidence: matchedPhrase?.exact ? 99 : 96,
      matchLabel:
        matchedPhrase && matchedPhrase.exact
          ? "Live translation + spoken phrase match"
          : "Live translation",
      confidenceNote:
        matchedPhrase && matchedPhrase.exact
          ? "Translated live and aligned with a saved spoken phrase"
          : `Live translation fetched (${String(liveTranslation.sourceLanguage).toUpperCase()} detected)`,
      speakingCoach:
        matchedPhrase && matchedPhrase.exact
          ? "Use the live result for accuracy, then repeat the saved spoken version to sound smoother."
          : "First read the basic translation, then repeat the spoken version with natural pauses and contractions.",
      practicePrompt:
        matchedPhrase && matchedPhrase.exact
          ? `Say this three times: "${naturalEnglish}" and then try "${betterAlternative}".`
          : `Repeat this aloud three times: "${naturalEnglish}" and focus on smooth pronunciation.`,
    },
    mode,
    "live"
  );
}

function cleanHindiSentence(text) {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "";
  }

  return /[.!?\u0964]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function createLineDefinitions(mode, values) {
  if (mode === "en-to-hi") {
    return [
      { key: "basic", label: "Basic Hindi", value: values.basic },
      { key: "natural", label: "Google Translation", value: values.natural },
      { key: "better", label: "Reference Meaning", value: values.better },
    ];
  }

  return [
    { key: "basic", label: "Basic English", value: values.basic },
    { key: "natural", label: "Google Translation", value: values.natural },
    { key: "better", label: "Reference Phrase", value: values.better },
  ];
}

function hasMeaningfulDifference(left, right) {
  return normalizeInput(left) !== normalizeInput(right);
}

async function fetchGoogleStyleTranslation(inputValue, mode) {
  const targetLanguage = mode === "en-to-hi" ? "hi" : "en";
  const endpoint = new URL("https://translate.googleapis.com/translate_a/single");
  endpoint.searchParams.set("client", "gtx");
  endpoint.searchParams.set("sl", "auto");
  endpoint.searchParams.set("tl", targetLanguage);
  endpoint.searchParams.set("dt", "t");
  endpoint.searchParams.set("dj", "1");
  endpoint.searchParams.set("q", inputValue);

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Live translation request failed with ${response.status}`);
  }

  const payload = await response.json();
  const translatedText = Array.isArray(payload.sentences)
    ? payload.sentences.map((sentence) => sentence.trans || "").join(" ").trim()
    : "";

  if (!translatedText) {
    throw new Error("Live translation response did not include translated text.");
  }

  return {
    translatedText,
    sourceLanguage: payload.src || "auto",
  };
}

function buildLiveResult(inputValue, liveTranslation, mode, matchedPhrase = null) {
  if (mode === "en-to-hi") {
    const directHindi = cleanHindiSentence(liveTranslation.translatedText);
    const referenceHindi = cleanHindiSentence(
      matchedPhrase?.phrase?.variants?.[0] || matchedPhrase?.phrase?.hindi || directHindi
    );

    return normalizeResultShape(
      {
        id: matchedPhrase?.exact ? matchedPhrase.phrase.id : null,
        input: inputValue,
        basicOutput: directHindi,
        naturalOutput: directHindi,
        betterOutput:
          matchedPhrase?.exact && hasMeaningfulDifference(directHindi, referenceHindi)
            ? referenceHindi
            : directHindi,
        primaryText: directHindi,
        explanation:
          matchedPhrase?.exact && hasMeaningfulDifference(directHindi, referenceHindi)
            ? "The main output comes directly from the live translation engine. The last line shows the closest saved phrase reference."
            : "The Hindi output comes directly from the live translation engine for Google-style accuracy.",
        commonMistake:
          "Read the complete Hindi meaning as one sentence instead of translating only key words.",
        confidence: matchedPhrase?.exact ? 99 : 96,
        matchLabel: "Live translation",
        confidenceNote: `Live translation fetched (${String(liveTranslation.sourceLanguage).toUpperCase()} detected)`,
        speakingCoach:
          "Use the main Hindi line exactly as shown if you want the closest machine-translated meaning.",
        practicePrompt: `Read this Hindi sentence aloud three times: "${directHindi}".`,
      },
      mode,
      "live"
    );
  }

  const directEnglish = cleanSentence(liveTranslation.translatedText);
  const referenceEnglish = cleanSentence(
    matchedPhrase?.phrase?.betterAlternative || matchedPhrase?.phrase?.naturalEnglish || directEnglish
  );

  return normalizeResultShape(
    {
      id: matchedPhrase?.exact ? matchedPhrase.phrase.id : null,
      input: inputValue,
      basicOutput: directEnglish,
      naturalOutput: directEnglish,
      betterOutput:
        matchedPhrase?.exact && hasMeaningfulDifference(directEnglish, referenceEnglish)
          ? referenceEnglish
          : directEnglish,
      primaryText: directEnglish,
      explanation:
        matchedPhrase?.exact && hasMeaningfulDifference(directEnglish, referenceEnglish)
          ? "The main output comes directly from the live translation engine. The last line shows the closest saved spoken reference."
          : "The English output comes directly from the live translation engine for Google-style accuracy.",
      commonMistake:
        "Read the full translated line first instead of breaking the meaning word by word.",
      confidence: matchedPhrase?.exact ? 99 : 96,
      matchLabel: "Live translation",
      confidenceNote: `Live translation fetched (${String(liveTranslation.sourceLanguage).toUpperCase()} detected)`,
      speakingCoach:
        "Use the main English line exactly as shown if you want the closest machine-translated result.",
      practicePrompt: `Repeat this aloud three times: "${directEnglish}".`,
    },
    mode,
    "live"
  );
}

export async function translateText(inputValue, siteData, mode = "hi-to-en") {
  const activeMode = TRANSLATION_MODES[mode] ? mode : "hi-to-en";
  const matchedPhrase =
    activeMode === "en-to-hi"
      ? findEnglishPhraseMatch(siteData, inputValue)
      : findHindiPhraseMatch(siteData, inputValue);

  try {
    const liveTranslation = await fetchGoogleStyleTranslation(inputValue, activeMode);
    return buildLiveResult(inputValue, liveTranslation, activeMode, matchedPhrase);
  } catch (error) {
    return buildFallbackResult(inputValue, activeMode, matchedPhrase);
  }
}

export async function translateHindiToEnglish(inputValue, siteData) {
  return translateText(inputValue, siteData, "hi-to-en");
}
