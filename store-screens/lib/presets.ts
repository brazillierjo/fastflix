export type Locale = "en" | "fr" | "es" | "de" | "it" | "ja";

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "fr", label: "Fran\u00E7ais", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "es", label: "Espa\u00F1ol", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "de", label: "Deutsch", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "it", label: "Italiano", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "ja", label: "\u65E5\u672C\u8A9E", flag: "\u{1F1EF}\u{1F1F5}" },
];

export interface SlidePreset {
  screenshotPath: string;
  titles: Record<Locale, string>;
  subtitles: Record<Locale, string>;
  backgroundType: "solid" | "gradient";
  backgroundColor: string;
  gradientPresetId: string;
  textPosition: "top" | "bottom";
  showDynamicIsland: boolean;
}

/**
 * Mobile slide presets (iPhone 6.5"/6.7" — 1242 x 2688).
 * Order optimized for App Store conversion.
 */
export const mobilePresets: SlidePreset[] = [
  {
    // 1.png — Home: daily pick, trending, personalized
    screenshotPath: "/screens/mobile/1.png",
    titles: {
      en: "Never Wonder\nWhat to Watch Again",
      fr: "Fini de Chercher\nQuoi Regarder",
      es: "Nunca M\u00e1s Sin Saber\nQu\u00e9 Ver",
      de: "Nie Wieder Ratlos\nVor dem Fernseher",
      it: "Mai Pi\u00f9 Indeciso\nSu Cosa Guardare",
      ja: "\u3082\u3046\u4F55\u3092\u898B\u308B\u304B\n\u8FF7\u308F\u306A\u3044",
    },
    subtitles: {
      en: "Daily picks and trending on your platforms",
      fr: "S\u00e9lections du jour et tendances sur vos plateformes",
      es: "Selecciones diarias y tendencias en tus plataformas",
      de: "T\u00e4gliche Auswahl und Trends auf deinen Plattformen",
      it: "Selezioni giornaliere e tendenze sulle tue piattaforme",
      ja: "\u6BCE\u65E5\u306E\u304A\u3059\u3059\u3081\u3068\u3042\u306A\u305F\u306E\u914D\u4FE1\u30B5\u30FC\u30D3\u30B9\u306E\u30C8\u30EC\u30F3\u30C9",
    },
    backgroundType: "gradient",
    backgroundColor: "#e50914",
    gradientPresetId: "fastflix-red",
    textPosition: "top",
    showDynamicIsland: true,
  },
  {
    // 2.png — AI Results: personalized recommendations
    screenshotPath: "/screens/mobile/2.png",
    titles: {
      en: "AI Picks Made\nJust for You",
      fr: "L'IA Choisit\nPour Vous",
      es: "La IA Elige\nPor Ti",
      de: "KI-Empfehlungen\nNur f\u00fcr Dich",
      it: "L'IA Sceglie\nPer Te",
      ja: "AI\u304C\u3042\u306A\u305F\u3060\u3051\u306B\n\u9078\u3076",
    },
    subtitles: {
      en: "Handpicked by AI based on your unique taste",
      fr: "S\u00e9lectionn\u00e9s par l'IA selon vos go\u00fbts uniques",
      es: "Elegidas por la IA seg\u00fan tus gustos \u00fanicos",
      de: "Von der KI ausgew\u00e4hlt, passend zu deinem Geschmack",
      it: "Scelti dall'IA in base ai tuoi gusti unici",
      ja: "AI\u304C\u3042\u306A\u305F\u306E\u597D\u307F\u306B\u5408\u308F\u305B\u3066\u53B3\u9078",
    },
    backgroundType: "gradient",
    backgroundColor: "#b30710",
    gradientPresetId: "fastflix-dark",
    textPosition: "top",
    showDynamicIsland: true,
  },
  {
    // 3.png — AI Search: describe what you want
    screenshotPath: "/screens/mobile/3.png",
    titles: {
      en: "Tell Us Your Mood,\nGet Instant Picks",
      fr: "Dites-Nous Votre Envie,\nRecevez des Id\u00e9es",
      es: "Dinos Tu Humor,\nRecibe Sugerencias",
      de: "Sag Uns Deine Laune,\nWir Liefern Filme",
      it: "Dicci il Tuo Umore,\nTrovi Subito un Film",
      ja: "\u6C17\u5206\u3092\u4F1D\u3048\u3066\n\u3074\u3063\u305F\u308A\u306E\u4F5C\u54C1\u3092",
    },
    subtitles: {
      en: "Describe what you feel like watching in your own words",
      fr: "D\u00e9crivez ce que vous avez envie de voir avec vos mots",
      es: "Describe lo que quieres ver con tus propias palabras",
      de: "Beschreibe einfach, worauf du Lust hast",
      it: "Descrivi quello che vuoi vedere con le tue parole",
      ja: "\u898B\u305F\u3044\u3082\u306E\u3092\u81EA\u5206\u306E\u8A00\u8449\u3067\u4F1D\u3048\u308B\u3060\u3051",
    },
    backgroundType: "gradient",
    backgroundColor: "#e50914",
    gradientPresetId: "fastflix-cinema",
    textPosition: "top",
    showDynamicIsland: true,
  },
  {
    // 4.png — Filters: platforms, country, content type
    screenshotPath: "/screens/mobile/4.png",
    titles: {
      en: "Only What's on\nYour Platforms",
      fr: "Uniquement Ce Qui Est\nSur Vos Plateformes",
      es: "Solo Lo Que Est\u00e1\nEn Tus Plataformas",
      de: "Nur Was auf\nDeinen Plattformen L\u00e4uft",
      it: "Solo Quello Che C'\u00e8\nSulle Tue Piattaforme",
      ja: "\u3042\u306A\u305F\u306E\u914D\u4FE1\n\u30B5\u30FC\u30D3\u30B9\u3060\u3051",
    },
    subtitles: {
      en: "Compatible with 30+ streaming services worldwide",
      fr: "Compatible avec plus de 30 services de streaming",
      es: "Compatible con m\u00e1s de 30 servicios de streaming",
      de: "Kompatibel mit \u00fcber 30 Streaming-Diensten weltweit",
      it: "Compatibile con oltre 30 servizi di streaming",
      ja: "\u4E16\u754C30\u4EE5\u4E0A\u306E\u914D\u4FE1\u30B5\u30FC\u30D3\u30B9\u306B\u5BFE\u5FDC",
    },
    backgroundType: "gradient",
    backgroundColor: "#990000",
    gradientPresetId: "fastflix-midnight",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 5.png — Movie Detail: rich info, cast, streaming
    screenshotPath: "/screens/mobile/5.png",
    titles: {
      en: "Cast, Ratings,\nWhere to Stream",
      fr: "Casting, Notes,\nO\u00f9 Regarder",
      es: "Reparto, Valoraciones,\nD\u00f3nde Verlo",
      de: "Besetzung, Bewertungen,\nWo Streamen",
      it: "Cast, Valutazioni,\nDove Guardarlo",
      ja: "\u30AD\u30E3\u30B9\u30C8\u3001\u8A55\u4FA1\u3001\n\u914D\u4FE1\u5148",
    },
    subtitles: {
      en: "All the details you need before pressing play",
      fr: "Toutes les infos avant de lancer la lecture",
      es: "Todos los detalles antes de darle al play",
      de: "Alle Infos bevor du auf Play dr\u00fcckst",
      it: "Tutti i dettagli prima di premere play",
      ja: "\u518D\u751F\u524D\u306B\u5FC5\u8981\u306A\u3059\u3079\u3066\u306E\u60C5\u5831",
    },
    backgroundType: "gradient",
    backgroundColor: "#cc0000",
    gradientPresetId: "fastflix-ember",
    textPosition: "top",
    showDynamicIsland: true,
  },
  {
    // 6.png — Quick Search: instant search
    screenshotPath: "/screens/mobile/6.png",
    titles: {
      en: "Find Any Movie\nin Seconds",
      fr: "Trouvez N'importe\nQuel Film en Secondes",
      es: "Encuentra Cualquier\nPel\u00edcula al Instante",
      de: "Finde Jeden Film\nin Sekunden",
      it: "Trova Qualsiasi\nFilm in un Attimo",
      ja: "\u3069\u3093\u306A\u6620\u753B\u3082\n\u6570\u79D2\u3067\u898B\u3064\u304B\u308B",
    },
    subtitles: {
      en: "Search movies, series and actors instantly",
      fr: "Recherchez films, s\u00e9ries et acteurs instantan\u00e9ment",
      es: "Busca pel\u00edculas, series y actores al instante",
      de: "Suche Filme, Serien und Schauspieler sofort",
      it: "Cerca film, serie e attori in un istante",
      ja: "\u6620\u753B\u3001\u30C9\u30E9\u30DE\u3001\u4FF3\u512A\u3092\u77AC\u6642\u691C\u7D22",
    },
    backgroundType: "gradient",
    backgroundColor: "#b30710",
    gradientPresetId: "fastflix-glow",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 7.png — Actor Detail: biography, filmography
    screenshotPath: "/screens/mobile/7.png",
    titles: {
      en: "Dive Into Any\nActor's Universe",
      fr: "Plongez Dans l'Univers\nde Chaque Acteur",
      es: "Sum\u00e9rgete en el Mundo\nde Cada Actor",
      de: "Tauche Ein in die Welt\nJedes Schauspielers",
      it: "Immergiti nel Mondo\ndi Ogni Attore",
      ja: "\u4FF3\u512A\u306E\u4E16\u754C\u306B\n\u98DB\u3073\u8FBC\u3082\u3046",
    },
    subtitles: {
      en: "Biography, filmography and behind the scenes",
      fr: "Biographie, filmographie et coulisses",
      es: "Biograf\u00eda, filmograf\u00eda y detr\u00e1s de c\u00e1maras",
      de: "Biografie, Filmografie und Hintergr\u00fcnde",
      it: "Biografia, filmografia e dietro le quinte",
      ja: "\u7D4C\u6B74\u3001\u51FA\u6F14\u4F5C\u54C1\u3001\u820E\u53F0\u88CF",
    },
    backgroundType: "gradient",
    backgroundColor: "#990000",
    gradientPresetId: "fastflix-dark",
    textPosition: "top",
    showDynamicIsland: true,
  },
  {
    // 8.png — Collections: watchlist, favorites, watched
    screenshotPath: "/screens/mobile/8.png",
    titles: {
      en: "Track What You Watch,\nSave What You Love",
      fr: "Suivez Ce Que Vous Voyez,\nSauvez Vos Coups de C\u0153ur",
      es: "Registra Lo Que Ves,\nGuarda Lo Que Te Encanta",
      de: "Behalte den \u00dcberblick,\nSpeichere Deine Favoriten",
      it: "Segna Cosa Hai Visto,\nSalva i Tuoi Preferiti",
      ja: "\u898B\u305F\u3082\u306E\u3092\u8A18\u9332\u3001\n\u597D\u304D\u306A\u3082\u306E\u3092\u4FDD\u5B58",
    },
    subtitles: {
      en: "Watchlist, ratings and favorite actors in one place",
      fr: "Liste, notes et acteurs pr\u00e9f\u00e9r\u00e9s au m\u00eame endroit",
      es: "Lista, valoraciones y actores favoritos en un lugar",
      de: "Merkliste, Bewertungen und Lieblingsschauspieler",
      it: "Lista, voti e attori preferiti in un unico posto",
      ja: "\u30A6\u30A9\u30C3\u30C1\u30EA\u30B9\u30C8\u3001\u8A55\u4FA1\u3001\u304A\u6C17\u306B\u5165\u308A\u4FF3\u512A\u3092\u4E00\u304B\u6240\u3067",
    },
    backgroundType: "gradient",
    backgroundColor: "#e50914",
    gradientPresetId: "fastflix-red",
    textPosition: "top",
    showDynamicIsland: true,
  },
];

/**
 * Tablet slide presets (iPad 12.9" — 2064 x 2752).
 * 7 slides (no Quick Search on tablet).
 */
export const tabletPresets: SlidePreset[] = [
  {
    // 1.png — Home
    screenshotPath: "/screens/tablet/1.png",
    titles: mobilePresets[0].titles,
    subtitles: mobilePresets[0].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#e50914",
    gradientPresetId: "fastflix-red",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 2.png — AI Results
    screenshotPath: "/screens/tablet/2.png",
    titles: mobilePresets[1].titles,
    subtitles: mobilePresets[1].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#b30710",
    gradientPresetId: "fastflix-dark",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 3.png — AI Search
    screenshotPath: "/screens/tablet/3.png",
    titles: mobilePresets[2].titles,
    subtitles: mobilePresets[2].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#e50914",
    gradientPresetId: "fastflix-cinema",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 4.png — Movie Detail
    screenshotPath: "/screens/tablet/4.png",
    titles: mobilePresets[4].titles, // mobile slide 5
    subtitles: mobilePresets[4].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#cc0000",
    gradientPresetId: "fastflix-ember",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 5.png — Actor Detail
    screenshotPath: "/screens/tablet/5.png",
    titles: mobilePresets[6].titles, // mobile slide 7
    subtitles: mobilePresets[6].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#990000",
    gradientPresetId: "fastflix-dark",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 6.png — Collections
    screenshotPath: "/screens/tablet/6.png",
    titles: mobilePresets[7].titles, // mobile slide 8
    subtitles: mobilePresets[7].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#e50914",
    gradientPresetId: "fastflix-red",
    textPosition: "top",
    showDynamicIsland: false,
  },
  {
    // 7.png — Filters
    screenshotPath: "/screens/tablet/7.png",
    titles: mobilePresets[3].titles, // mobile slide 4
    subtitles: mobilePresets[3].subtitles,
    backgroundType: "gradient",
    backgroundColor: "#990000",
    gradientPresetId: "fastflix-midnight",
    textPosition: "top",
    showDynamicIsland: false,
  },
];
