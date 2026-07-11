"use strict";
/* Données statiques : villes, tests MBTI & BDSM, profils de démo. */
(function (global) {

  const CITIES = [
    ["Paris", 48.8566, 2.3522, "Europe/Paris"], ["Marseille", 43.2965, 5.3698, "Europe/Paris"],
    ["Lyon", 45.764, 4.8357, "Europe/Paris"], ["Toulouse", 43.6047, 1.4442, "Europe/Paris"],
    ["Nice", 43.7102, 7.262, "Europe/Paris"], ["Nantes", 47.2184, -1.5536, "Europe/Paris"],
    ["Strasbourg", 48.5734, 7.7521, "Europe/Paris"], ["Bordeaux", 44.8378, -0.5792, "Europe/Paris"],
    ["Lille", 50.6292, 3.0573, "Europe/Paris"], ["Bruxelles", 50.8503, 4.3517, "Europe/Brussels"],
    ["Genève", 46.2044, 6.1432, "Europe/Zurich"], ["Lausanne", 46.5197, 6.6323, "Europe/Zurich"],
    ["Luxembourg", 49.6116, 6.1319, "Europe/Luxembourg"], ["Montréal", 45.5017, -73.5673, "America/Toronto"],
    ["Québec", 46.8139, -71.208, "America/Toronto"], ["Dakar", 14.7167, -17.4677, "Africa/Dakar"],
    ["Abidjan", 5.36, -4.0083, "Africa/Abidjan"], ["Casablanca", 33.5731, -7.5898, "Africa/Casablanca"],
    ["Alger", 36.7538, 3.0588, "Africa/Algiers"], ["Tunis", 36.8065, 10.1815, "Africa/Tunis"],
    ["Beyrouth", 33.8938, 35.5018, "Asia/Beirut"], ["Antananarivo", -18.8792, 47.5079, "Indian/Antananarivo"],
    ["Port-au-Prince", 18.5944, -72.3074, "America/Port-au-Prince"], ["Cayenne", 4.9224, -52.3135, "America/Cayenne"],
    ["Fort-de-France", 14.6161, -61.0588, "America/Martinique"], ["Papeete", -17.5325, -149.5665, "Pacific/Tahiti"],
    ["Nouméa", -22.2758, 166.458, "Pacific/Noumea"], ["Kinshasa", -4.4419, 15.2663, "Africa/Kinshasa"],
    ["Yaoundé", 3.848, 11.5021, "Africa/Douala"], ["Londres", 51.5074, -0.1278, "Europe/London"],
    ["Madrid", 40.4168, -3.7038, "Europe/Madrid"], ["Rome", 41.9028, 12.4964, "Europe/Rome"],
    ["Berlin", 52.52, 13.405, "Europe/Berlin"], ["Lisbonne", 38.7223, -9.1393, "Europe/Lisbon"],
    ["New York", 40.7128, -74.006, "America/New_York"], ["Los Angeles", 34.0522, -118.2437, "America/Los_Angeles"],
    ["Mexico", 19.4326, -99.1332, "America/Mexico_City"], ["São Paulo", -23.5505, -46.6333, "America/Sao_Paulo"],
    ["Buenos Aires", -34.6037, -58.3816, "America/Argentina/Buenos_Aires"], ["Tokyo", 35.6762, 139.6503, "Asia/Tokyo"],
    ["Montevideo", -34.9011, -56.1645, "America/Montevideo"], ["Hong Kong", 22.3193, 114.1694, "Asia/Hong_Kong"],
    ["Bangkok", 13.7563, 100.5018, "Asia/Bangkok"], ["Mumbai", 19.076, 72.8777, "Asia/Kolkata"],
    ["Dubaï", 25.2048, 55.2708, "Asia/Dubai"], ["Le Caire", 30.0444, 31.2357, "Africa/Cairo"],
    ["Johannesburg", -26.2041, 28.0473, "Africa/Johannesburg"], ["Sydney", -33.8688, 151.2093, "Australia/Sydney"],
    ["Moscou", 55.7558, 37.6173, "Europe/Moscow"], ["Istanbul", 41.0082, 28.9784, "Europe/Istanbul"],
  ];
  const CITY_BY_NAME = Object.fromEntries(CITIES.map((c) => [c[0], { lat: c[1], lon: c[2], zone: c[3] }]));

  const AVATARS = ["🦊", "🦋", "🌙", "🌻", "🐬", "🦁", "🦚", "🐺", "🌊", "🔥", "🌸", "🍃", "⭐", "🕊️", "🦌", "🐝"];

  /* ------------------------ Test MBTI (12 questions) ------------------
   * dim : 0 = E/I, 1 = N/S, 2 = T/F, 3 = J/P. a → première lettre, b → seconde. */
  const MBTI_QUESTIONS = [
    { dim: 0, a: "E", b: "I", ta: "Je me ressource entouré·e de monde.", tb: "Je me ressource dans le calme, en solo." },
    { dim: 0, a: "E", b: "I", ta: "Je pense à voix haute, spontanément.", tb: "Je réfléchis en moi avant de parler." },
    { dim: 0, a: "E", b: "I", ta: "J'aborde facilement des inconnu·es.", tb: "Je vais vers les autres avec réserve." },
    { dim: 1, a: "N", b: "S", ta: "Je me fie à l'intuition et aux idées.", tb: "Je me fie aux faits concrets et à l'expérience." },
    { dim: 1, a: "N", b: "S", ta: "J'imagine les possibles, le futur.", tb: "Je vis le présent, le tangible." },
    { dim: 1, a: "N", b: "S", ta: "J'aime les concepts et métaphores.", tb: "J'aime le pratique et le détail." },
    { dim: 2, a: "T", b: "F", ta: "Je décide avec la logique.", tb: "Je décide avec le cœur et les valeurs." },
    { dim: 2, a: "T", b: "F", ta: "Je privilégie la vérité, même rude.", tb: "Je privilégie l'harmonie et le tact." },
    { dim: 2, a: "T", b: "F", ta: "On me dit juste et objectif·ve.", tb: "On me dit empathique et chaleureux·se." },
    { dim: 3, a: "J", b: "P", ta: "J'aime planifier et décider tôt.", tb: "J'aime garder mes options ouvertes." },
    { dim: 3, a: "J", b: "P", ta: "J'aime l'ordre et les listes.", tb: "J'aime l'improvisation et la souplesse." },
    { dim: 3, a: "J", b: "P", ta: "Je finis avant l'échéance.", tb: "Je carbure à la dernière minute." },
  ];
  function scoreMbti(answers) {
    // answers : tableau de 'a' | 'b' aligné sur MBTI_QUESTIONS
    const tally = { E: 0, I: 0, N: 0, S: 0, T: 0, F: 0, J: 0, P: 0 };
    answers.forEach((ans, i) => {
      const q = MBTI_QUESTIONS[i];
      tally[ans === "a" ? q.a : q.b]++;
    });
    return (tally.E >= tally.I ? "E" : "I") + (tally.N >= tally.S ? "N" : "S") +
           (tally.T >= tally.F ? "T" : "F") + (tally.J >= tally.P ? "J" : "P");
  }

  /* ------------------------ Test BDSM (25 questions, 18+) -------------
   * Chaque énoncé se note de 1 (pas du tout) à 10 (tout à fait) et alimente
   * un trait (0..1). Adaptation légère inspirée de bdsmtest.org. */
  const BDSM_QUESTIONS = [
    { trait: "dominant", t: "J'aime prendre le contrôle et diriger." },
    { trait: "submissive", t: "J'aime m'abandonner et suivre les directives." },
    { trait: "sadist", t: "Donner des sensations intenses à l'autre m'excite." },
    { trait: "masochist", t: "Recevoir des sensations intenses peut me plaire." },
    { trait: "rigger", t: "J'aime attacher / immobiliser un·e partenaire." },
    { trait: "ropebunny", t: "J'aime être attaché·e / immobilisé·e." },
    { trait: "brattamer", t: "J'aime canaliser un·e partenaire espiègle." },
    { trait: "brat", t: "Provoquer avec malice pour être recadré·e m'amuse." },
    { trait: "owner", t: "Posséder / guider un·e partenaire dévoué·e me plaît." },
    { trait: "pet", t: "M'en remettre pleinement à quelqu'un m'attire." },
    { trait: "daddy", t: "Un rôle protecteur et rassurant me parle." },
    { trait: "little", t: "Recevoir douceur et protection dans un rôle plus tendre me parle." },
    { trait: "voyeur", t: "Regarder / être spectateur·rice m'excite." },
    { trait: "exhibitionist", t: "Être regardé·e / me montrer m'excite." },
    { trait: "experimental", t: "Je suis curieux·se d'explorer de nouvelles pratiques." },
    { trait: "switch", t: "Je peux aussi bien dominer que me soumettre selon l'instant." },
    { trait: "candauliste", t: "Montrer ou partager mon/ma partenaire avec d'autres m'excite." },
    { trait: "hotwife", t: "Avoir des aventures ouvertes, au su et à l'excitation de mon/ma partenaire, me plaît." },
    { trait: "polygame", t: "Je me verrais bien dans une relation à plusieurs ou non-exclusive." },
    { trait: "blackaddict", t: "Je suis particulièrement attiré·e par les partenaires noir·es." },
    { trait: "bigcock", t: "Je suis particulièrement attiré·e par les partenaires très bien membrés." },
    { trait: "asexual", t: "Je ressens peu ou pas d'attirance sexuelle." },
    { trait: "hypersexual", t: "J'ai une libido très élevée ; le sexe tient une grande place pour moi." },
    { trait: "daddybaby", t: "La dynamique Daddy/Baby (protéger d'un côté, être choyé·e de l'autre) me parle." },
    { trait: "echangiste", t: "Échanger de partenaire avec un autre couple m'attire (échangisme)." },
  ];
  function scoreBdsm(answers) {
    // answers : tableau d'entiers 1..10 aligné sur BDSM_QUESTIONS
    const out = {};
    answers.forEach((v, i) => { out[BDSM_QUESTIONS[i].trait] = (Math.max(1, Math.min(10, v || 1)) - 1) / 9; });
    return out;
  }

  /* --------------------------- Profils de démo ----------------------- */
  const c = (name) => CITY_BY_NAME[name];
  const SEED = [
    { id: "s1", name: "Camille", avatar: "🦋", gender: "F", seeking: "T", bio: "Autrice le jour, danseuse la nuit. Cherche une âme curieuse.",
      year: 1993, month: 6, day: 21, time: "04:30", city: "Paris", mbti: "INFP",
      bdsm: { submissive: 0.8, masochist: 0.6, ropebunny: 0.75, little: 0.7, brat: 0.4, experimental: 0.8, switch: 0.2, exhibitionist: 0.5 } },
    { id: "s2", name: "Alex", avatar: "🦊", gender: "H", seeking: "T", bio: "Ingénieur, grimpeur, amateur de vin nature et de longues conversations.",
      year: 1990, month: 11, day: 3, time: "09:15", city: "Lyon", mbti: "ENTJ",
      bdsm: { dominant: 0.85, sadist: 0.6, rigger: 0.8, owner: 0.7, brattamer: 0.7, experimental: 0.6, switch: 0.2, voyeur: 0.5 } },
    { id: "s3", name: "Sam", avatar: "🌙", gender: "NB", seeking: "T", superLikedYou: true, bio: "Photographe nomade. Je collectionne les couchers de soleil et les vinyles.",
      year: 1996, month: 2, day: 14, time: "18:40", city: "Bruxelles", mbti: "ENFP",
      bdsm: { switch: 0.85, dominant: 0.5, submissive: 0.5, experimental: 0.9, brat: 0.6, exhibitionist: 0.6, voyeur: 0.6 } },
    { id: "s4", name: "Léa", avatar: "🌻", gender: "F", seeking: "H", bio: "Médecin, marathonienne. Pragmatique mais grande romantique au fond.",
      year: 1988, month: 8, day: 30, time: "12:00", city: "Bordeaux", mbti: "ISTJ",
      bdsm: null },
    { id: "s5", name: "Malik", avatar: "🦁", gender: "H", seeking: "F", bio: "Chef cuisinier. Je séduis à l'assiette. Team feu de bois et épices.",
      year: 1991, month: 4, day: 12, time: "22:10", city: "Marseille", mbti: "ESFP",
      bdsm: { dominant: 0.6, primalhunter: 0.7, sadist: 0.4, owner: 0.5, exhibitionist: 0.6, experimental: 0.7, switch: 0.4 } },
    { id: "s6", name: "Nadia", avatar: "🦚", gender: "F", seeking: "T", superLikedYou: true, bio: "Avocate le jour, potière le week-end. J'aime l'esprit vif et la tendresse.",
      year: 1994, month: 12, day: 19, time: "07:25", city: "Genève", mbti: "INTJ",
      bdsm: { dominant: 0.75, brattamer: 0.65, rigger: 0.6, degrader: 0.4, owner: 0.6, experimental: 0.5, switch: 0.3 } },
    { id: "s7", name: "Théo", avatar: "🐬", gender: "H", seeking: "T", bio: "Prof de philo, plongeur, insomniaque poétique. On refait le monde ?",
      year: 1995, month: 9, day: 5, time: "02:50", city: "Nantes", mbti: "INFJ",
      bdsm: { submissive: 0.7, ropebunny: 0.55, little: 0.5, masochist: 0.5, experimental: 0.6, switch: 0.4, pet: 0.5 } },
    { id: "s8", name: "Inès", avatar: "🌊", gender: "F", seeking: "T", bio: "Développeuse et surfeuse. Introvertie assumée, humour très sec.",
      year: 1992, month: 1, day: 28, time: "15:05", city: "Nice", mbti: "ISTP",
      bdsm: { switch: 0.7, submissive: 0.5, dominant: 0.5, masochist: 0.5, sadist: 0.4, experimental: 0.7, ropebunny: 0.5 } },
    { id: "s9", name: "Yanis", avatar: "🐺", gender: "H", seeking: "T", bio: "Kiné, boxeur du dimanche, papa d'un petit gars de 4 ans. La vie est belle.",
      year: 1987, month: 5, day: 9, time: "11:30", city: "Toulouse", mbti: "ESTP",
      bdsm: { dominant: 0.6, sadist: 0.5, rigger: 0.55, primalhunter: 0.6, owner: 0.5, experimental: 0.6, switch: 0.3 } },
    { id: "s10", name: "Chloé", avatar: "🌸", gender: "F", seeking: "H", bio: "Vétérinaire, deux chats et un lévrier. Si tu es allergique, on trouvera une solution 😅",
      year: 1997, month: 10, day: 2, time: "20:15", city: "Lille", mbti: "ENFJ",
      bdsm: { submissive: 0.65, little: 0.6, masochist: 0.45, ropebunny: 0.5, pet: 0.55, experimental: 0.6, switch: 0.35 } },
    { id: "s11", name: "Robin", avatar: "🍃", gender: "NB", seeking: "T", bio: "Libraire, poète du dimanche, fan de thé fumé et de longues balades.",
      year: 1993, month: 3, day: 27, time: "05:45", city: "Strasbourg", mbti: "INFP",
      bdsm: null },
    { id: "s12", name: "Amara", avatar: "🕊️", gender: "F", seeking: "T", bio: "Sage-femme le jour, DJ occasionnelle. J'aime rire fort et aimer franchement.",
      year: 1990, month: 7, day: 18, time: "23:40", city: "Dakar", mbti: "ESFJ",
      bdsm: { dominant: 0.55, brattamer: 0.55, owner: 0.5, exhibitionist: 0.5, experimental: 0.55, switch: 0.45 } },
  ];

  /* ----------------------- Centres d'intérêt ------------------------- */
  const INTERESTS = [
    ["Street food", "🍜"], ["Café", "☕"], ["Vin nature", "🍷"], ["Cuisine", "🍳"],
    ["Bubble tea", "🧋"], ["Voyages", "✈️"], ["Randonnée", "🥾"], ["Nature", "🏞️"],
    ["Yoga", "🧘"], ["Méditation", "🕉️"], ["Spa", "🕯️"], ["Prendre soin de soi", "🌼"],
    ["Sport", "🏋️"], ["Danse", "💃"], ["Musique", "🎧"], ["Concerts", "🎤"],
    ["Cinéma", "🎬"], ["Lecture", "📚"], ["Écriture", "✍️"], ["Art", "🎨"],
    ["Photographie", "📷"], ["Jeux vidéo", "🎮"], ["Mode", "👗"], ["Animaux", "🐾"],
    ["Spiritualité", "🔮"], ["Astrologie", "✨"], ["Bénévolat", "🤝"], ["Fêtes", "🎉"],
    ["Surf", "🏄"], ["Vélo", "🚲"], ["Théâtre", "🎭"], ["Bricolage", "🔨"],
  ];
  const INTEREST_EMOJI = Object.fromEntries(INTERESTS.map(([l, e]) => [l, e]));

  const SEED_INTERESTS = {
    s1: ["Danse", "Écriture", "Concerts", "Café", "Voyages"],
    s2: ["Randonnée", "Vin nature", "Sport", "Voyages", "Cuisine"],
    s3: ["Photographie", "Musique", "Voyages", "Art", "Fêtes"],
    s4: ["Sport", "Cuisine", "Nature", "Cinéma", "Prendre soin de soi"],
    s5: ["Cuisine", "Street food", "Musique", "Fêtes", "Vin nature"],
    s6: ["Art", "Lecture", "Spiritualité", "Café", "Astrologie"],
    s7: ["Lecture", "Écriture", "Cinéma", "Nature", "Méditation"],
    s8: ["Surf", "Jeux vidéo", "Musique", "Nature", "Café"],
    s9: ["Sport", "Nature", "Animaux", "Cuisine", "Vélo"],
    s10: ["Animaux", "Nature", "Prendre soin de soi", "Bubble tea", "Bénévolat"],
    s11: ["Lecture", "Café", "Nature", "Écriture", "Théâtre"],
    s12: ["Danse", "Musique", "Fêtes", "Bien-être", "Voyages"],
  };
  SEED.forEach((s) => { s.interests = SEED_INTERESTS[s.id] || []; });

  /* --------- Petits textes « anti-mauvais-critères » (éparpillés) ------ */
  const NUDGES = [
    { icon: "🐾", title: "« Pas d'animaux » ?",
      text: "Beaucoup d'histoires commencent par un chat qu'on finit par adorer. Écarter quelqu'un pour un poil, c'est parfois fermer la porte à un grand amour. Une allergie se gère ; une belle rencontre ne se remplace pas." },
    { icon: "👶", title: "« Sans enfants », vraiment ?",
      text: "Refuser d'emblée une personne qui a des enfants, c'est écarter quelqu'un qui sait déjà aimer, protéger et s'engager. Les familles se réinventent — l'amour ne se planifie pas sur un tableur." },
    { icon: "🌱", title: "Besoin qu'on se dédie à 100 % ?",
      text: "Un amour sain, c'est deux personnes entières — pas une qui se dissout dans l'autre. Le vrai « pour toujours » laisse à chacun de l'air pour respirer. Chercher une dévotion totale, c'est souvent la dépendance qui parle, pas le cœur." },
    { icon: "💫", title: "Trop de critères physiques ?",
      text: "Filtrer sur la taille, le poids ou la couleur des yeux, c'est trier des inconnus sur 2 % de ce qu'ils sont. Le charme, la voix, le rire, la manière d'écouter… rien de tout ça ne tient dans une case." },
    { icon: "🔥", title: "Des exigences très précises… au lit ?",
      text: "Le désir se construit, se parle, s'apprivoise à deux. Poser trop de conditions d'avance, c'est souvent la peur déguisée en cahier des charges. Laissez de la place à la surprise." },
    { icon: "🧭", title: "Vos meilleurs matchs sont hors de vos filtres",
      text: "L'âme sœur est peut-être à 2 ans ou à 20 km de vos réglages. Élargissez d'un cran : la compatibilité profonde ne coche pas toujours les cases qu'on avait prévues." },
  ];

  global.Data = {
    CITIES, CITY_BY_NAME, AVATARS,
    MBTI_QUESTIONS, scoreMbti, BDSM_QUESTIONS, scoreBdsm, SEED, NUDGES,
    INTERESTS, INTEREST_EMOJI,
  };
})(typeof window !== "undefined" ? window : globalThis);
