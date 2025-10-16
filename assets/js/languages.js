// /assets/js/languages.js
// Zentrale Definition aller unterstützten Sprachen + Helfer

window.AppLangs = (() => {
  /** Liste aller Sprachen (Code nach BCP-47) */
  const LANGS = [
    // Europa (Kern)
    { code: "de",      native: "Deutsch",                 english: "German",                  dir: "ltr" },
    { code: "en",      native: "English",                 english: "English",                dir: "ltr" },
    { code: "fr",      native: "Français",                english: "French",                 dir: "ltr" },
    { code: "es",      native: "Español",                 english: "Spanish",                dir: "ltr" },
    { code: "it",      native: "Italiano",                english: "Italian",                dir: "ltr" },
    { code: "nl",      native: "Nederlands",              english: "Dutch",                  dir: "ltr" },
    { code: "pl",      native: "Polski",                  english: "Polish",                 dir: "ltr" },
    { code: "pt-PT",   native: "Português (Portugal)",    english: "Portuguese (EU)",        dir: "ltr" },
    { code: "sv",      native: "Svenska",                 english: "Swedish",                dir: "ltr" },
    { code: "nb",      native: "Norsk Bokmål",            english: "Norwegian Bokmål",       dir: "ltr" },
    { code: "da",      native: "Dansk",                   english: "Danish",                 dir: "ltr" },
    { code: "fi",      native: "Suomi",                   english: "Finnish",                dir: "ltr" },
    { code: "cs",      native: "Čeština",                 english: "Czech",                  dir: "ltr" },
    { code: "sk",      native: "Slovenčina",              english: "Slovak",                 dir: "ltr" },
    { code: "sl",      native: "Slovenščina",             english: "Slovenian",              dir: "ltr" },
    { code: "hu",      native: "Magyar",                  english: "Hungarian",              dir: "ltr" },
    { code: "el",      native: "Ελληνικά",                english: "Greek",                  dir: "ltr" },
    { code: "ro",      native: "Română",                  english: "Romanian",               dir: "ltr" },
    { code: "bg",      native: "Български",               english: "Bulgarian",              dir: "ltr" },
    { code: "ru",      native: "Русский",                 english: "Russian",                dir: "ltr" },
    { code: "uk",      native: "Українська",              english: "Ukrainian",              dir: "ltr" },
    { code: "sr",      native: "Srpski",                  english: "Serbian",                dir: "ltr" },
    { code: "bs",      native: "Bosanski",                english: "Bosnian",                dir: "ltr" },
    { code: "hr",      native: "Hrvatski",                english: "Croatian",               dir: "ltr" },
    { code: "sq",      native: "Shqip",                   english: "Albanian",               dir: "ltr" },

    // MENA / Flüchtlingskontext
    { code: "ar",      native: "العربية",                 english: "Arabic",                 dir: "rtl" },
    { code: "fa",      native: "فارسی (فارسی)",          english: "Persian (Farsi)",        dir: "rtl" },
    { code: "prs",     native: "دری",                     english: "Dari",                   dir: "rtl" },
    { code: "ps",      native: "پښتو",                    english: "Pashto",                 dir: "rtl" },
    { code: "ku",      native: "Kurdî (Kurmanji)",        english: "Kurdish (Kurmanji)",     dir: "rtl" }, // Kurmanji häufig LTR geschrieben, hier konservativ RTL für UI-Spiegelung
    { code: "ckb",     native: "کوردی (سۆرانی)",         english: "Kurdish (Sorani)",       dir: "rtl" },
    { code: "he",      native: "עברית",                   english: "Hebrew",                 dir: "rtl" },
    { code: "ti",      native: "ትግርኛ",                   english: "Tigrinya",               dir: "ltr" },
    { code: "so",      native: "Soomaali",                english: "Somali",                 dir: "ltr" },
    { code: "sw",      native: "Kiswahili",               english: "Swahili",                dir: "ltr" },
    { code: "ha",      native: "Hausa",                   english: "Hausa",                  dir: "ltr" },
    { code: "am",      native: "አማርኛ",                   english: "Amharic",                dir: "ltr" },

    // Südasien / Ost-/Südostasien
    { code: "hi",      native: "हिन्दी",                  english: "Hindi",                  dir: "ltr" },
    { code: "bn",      native: "বাংলা",                   english: "Bengali",                dir: "ltr" },
    { code: "ur",      native: "اردو",                    english: "Urdu",                   dir: "rtl" },
    { code: "ne",      native: "नेपाली",                  english: "Nepali",                 dir: "ltr" },
    { code: "ta",      native: "தமிழ்",                   english: "Tamil",                  dir: "ltr" },
    { code: "pa",      native: "ਪੰਜਾਬੀ",                  english: "Punjabi",                dir: "ltr" },
    { code: "id",      native: "Indonesia",               english: "Indonesian",             dir: "ltr" },
    { code: "ms",      native: "Melayu",                  english: "Malay",                  dir: "ltr" },
    { code: "fil",     native: "Filipino",                english: "Filipino/Tagalog",       dir: "ltr" },
    { code: "km",      native: "ខ្មែរ",                    english: "Khmer",                  dir: "ltr" },
    { code: "th",      native: "ไทย",                      english: "Thai",                   dir: "ltr" },
    { code: "vi",      native: "Tiếng Việt",              english: "Vietnamese",             dir: "ltr" },
    { code: "zh-Hans", native: "简体中文",                 english: "Chinese (Simplified)",   dir: "ltr" }
  ];

  /** Hilfssets/-listen */
  const SUPPORTED = LANGS.map(l => l.code);
  const RTL = new Set(LANGS.filter(l => l.dir === "rtl").map(l => l.code));

  /** Normalisierung von Browser-Codes (bspw. pt-BR → pt-PT, no → nb, zh → zh-Hans) */
  function normalize(raw) {
    if (!raw) return "de";
    const lc = raw.toLowerCase();
    if (SUPPORTED.includes(lc)) return lc;
    const base = lc.split("-")[0];
    if (SUPPORTED.includes(base)) return base;

    const map = {
      "pt": "pt-PT",
      "pt-br": "pt-PT",
      "no": "nb",
      "zh": "zh-Hans",
      "ku-iq": "ckb",   // Sorani
      "ku-arab": "ckb"
    };
    return map[lc] || map[base] || "de";
  }

  /** Menschlich lesbarer Name (native oder englisch), je nach Bedarf */
  function displayName(code, prefer = "native") {
    const lang = LANGS.find(l => l.code === code);
    if (!lang) return code;
    return prefer === "english" ? lang.english : lang.native;
  }

  return { LANGS, SUPPORTED, RTL, normalize, displayName };
})();
