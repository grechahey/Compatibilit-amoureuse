"use strict";
/* ================================================================== *
 *  MOTEUR DE COMPATIBILITÉ — Âme Sœur
 *  Astro (Soleil + ascendant, calcul astronomique exact), astrologie
 *  chinoise, numérologie, MBTI, BDSM. Tout est déterministe.
 *  Les modules astro/chinois/numérologie/MBTI sont validés contre
 *  pyephem, Swiss Ephemeris et lunardate (voir historique du projet).
 * ================================================================== */
(function (global) {
  const rad = Math.PI / 180;
  const norm360 = (x) => ((x % 360) + 360) % 360;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  /* ------------------------- Zodiaque solaire ------------------------- */
  const ZODIAC = [
    { name: "Bélier", emoji: "♈", element: "feu" },
    { name: "Taureau", emoji: "♉", element: "terre" },
    { name: "Gémeaux", emoji: "♊", element: "air" },
    { name: "Cancer", emoji: "♋", element: "eau" },
    { name: "Lion", emoji: "♌", element: "feu" },
    { name: "Vierge", emoji: "♍", element: "terre" },
    { name: "Balance", emoji: "♎", element: "air" },
    { name: "Scorpion", emoji: "♏", element: "eau" },
    { name: "Sagittaire", emoji: "♐", element: "feu" },
    { name: "Capricorne", emoji: "♑", element: "terre" },
    { name: "Verseau", emoji: "♒", element: "air" },
    { name: "Poissons", emoji: "♓", element: "eau" },
  ];
  const ELEMENT_AFFINITY = {
    feu: { feu: 0.8, terre: 0.45, air: 0.95, eau: 0.4 },
    terre: { feu: 0.45, terre: 0.85, air: 0.5, eau: 0.95 },
    air: { feu: 0.95, terre: 0.5, air: 0.8, eau: 0.45 },
    eau: { feu: 0.4, terre: 0.95, air: 0.45, eau: 0.9 },
  };

  function julianDay(y, m, d, hours) {
    if (m <= 2) { y -= 1; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) +
           d + B - 1524.5 + hours / 24;
  }
  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
              0.000289 * Math.sin(3 * M);
    const omega = 125.04 - 1934.136 * T;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * rad);
    return norm360(lambda);
  }
  function signIndexAt(date, hours) {
    const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), hours);
    return Math.floor(sunLongitude(jd) / 30) % 12;
  }
  function sunSign(date) { return ZODIAC[signIndexAt(date, 12)]; }
  function cuspInfo(date) {
    const a = signIndexAt(date, 0), b = signIndexAt(date, 24);
    return a === b ? null : { from: ZODIAC[a], to: ZODIAC[b] };
  }

  /* ---------------------------- Ascendant ---------------------------- */
  function meanObliquity(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    return 23.4392911 - 0.0130041667 * T - 1.6388889e-7 * T * T + 5.0361111e-7 * T * T * T;
  }
  function nutation(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const Om = (125.04452 - 1934.136261 * T) * rad;
    const L = (280.4665 + 36000.7698 * T) * rad;
    const Lp = (218.3165 + 481267.8813 * T) * rad;
    const dPsi = (-17.20 * Math.sin(Om) - 1.32 * Math.sin(2 * L) - 0.23 * Math.sin(2 * Lp) + 0.21 * Math.sin(2 * Om)) / 3600;
    const dEps = (9.20 * Math.cos(Om) + 0.57 * Math.cos(2 * L) + 0.10 * Math.cos(2 * Lp) - 0.09 * Math.cos(2 * Om)) / 3600;
    return { dPsi, dEps };
  }
  function gmst(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - (T * T * T) / 38710000.0);
  }
  function ascendantLongitude(jd, lat, lonEast) {
    const { dPsi, dEps } = nutation(jd);
    const eps = (meanObliquity(jd) + dEps) * rad;
    const gast = gmst(jd) + dPsi * Math.cos(eps);
    const ramc = norm360(gast + lonEast) * rad;
    const phi = lat * rad;
    const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
    return norm360(asc / rad);
  }
  function tzOffsetMinutes(zone, ts) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const p = {};
    for (const part of dtf.formatToParts(ts)) if (part.type !== "literal") p[part.type] = part.value;
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ts) / 60000);
  }
  function zonedToUtc(zone, y, mo, d, h, mi) {
    let ts = Date.UTC(y, mo - 1, d, h, mi);
    const o1 = tzOffsetMinutes(zone, ts);
    ts -= o1 * 60000;
    const o2 = tzOffsetMinutes(zone, ts);
    if (o2 !== o1) ts = Date.UTC(y, mo - 1, d, h, mi) - o2 * 60000;
    return new Date(ts);
  }
  // Ascendant depuis date locale, heure "HH:MM", fuseau IANA, lat/lon.
  function ascendant(date, timeStr, zone, lat, lonEast) {
    if (!timeStr || !zone || lat == null) return null;
    const [hh, mm] = timeStr.split(":").map(Number);
    const utc = zonedToUtc(zone, date.getFullYear(), date.getMonth() + 1, date.getDate(), hh, mm);
    const utH = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
    const jd = julianDay(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate(), utH);
    return ZODIAC[Math.floor(ascendantLongitude(jd, lat, lonEast) / 30) % 12];
  }

  /* ------------------------ Astrologie chinoise ---------------------- */
  const CHINESE = [
    { name: "Singe", emoji: "🐒" }, { name: "Coq", emoji: "🐓" }, { name: "Chien", emoji: "🐕" },
    { name: "Cochon", emoji: "🐖" }, { name: "Rat", emoji: "🐀" }, { name: "Buffle", emoji: "🐂" },
    { name: "Tigre", emoji: "🐅" }, { name: "Lapin", emoji: "🐇" }, { name: "Dragon", emoji: "🐉" },
    { name: "Serpent", emoji: "🐍" }, { name: "Cheval", emoji: "🐴" }, { name: "Chèvre", emoji: "🐐" },
  ];
  const CNY = (function () {
    const raw =
      "1930:1-30 1931:2-17 1932:2-6 1933:1-26 1934:2-14 1935:2-4 1936:1-24 1937:2-11 1938:1-31 1939:2-19 " +
      "1940:2-8 1941:1-27 1942:2-15 1943:2-5 1944:1-25 1945:2-13 1946:2-2 1947:1-22 1948:2-10 1949:1-29 " +
      "1950:2-17 1951:2-6 1952:1-27 1953:2-14 1954:2-3 1955:1-24 1956:2-12 1957:1-31 1958:2-18 1959:2-8 " +
      "1960:1-28 1961:2-15 1962:2-5 1963:1-25 1964:2-13 1965:2-2 1966:1-21 1967:2-9 1968:1-30 1969:2-17 " +
      "1970:2-6 1971:1-27 1972:2-15 1973:2-3 1974:1-23 1975:2-11 1976:1-31 1977:2-18 1978:2-7 1979:1-28 " +
      "1980:2-16 1981:2-5 1982:1-25 1983:2-13 1984:2-2 1985:2-20 1986:2-9 1987:1-29 1988:2-17 1989:2-6 " +
      "1990:1-27 1991:2-15 1992:2-4 1993:1-23 1994:2-10 1995:1-31 1996:2-19 1997:2-7 1998:1-28 1999:2-16 " +
      "2000:2-5 2001:1-24 2002:2-12 2003:2-1 2004:1-22 2005:2-9 2006:1-29 2007:2-18 2008:2-7 2009:1-26 " +
      "2010:2-14 2011:2-3 2012:1-23 2013:2-10 2014:1-31 2015:2-19 2016:2-8 2017:1-28 2018:2-16 2019:2-5 " +
      "2020:1-25 2021:2-12 2022:2-1 2023:1-22 2024:2-10 2025:1-29 2026:2-17 2027:2-6 2028:1-26 2029:2-13 " +
      "2030:2-3 2031:1-23 2032:2-11 2033:1-31 2034:2-19 2035:2-8 2036:1-28 2037:2-15 2038:2-4 2039:1-24 " +
      "2040:2-12 2041:2-1 2042:1-22 2043:2-10 2044:1-30";
    const o = {};
    for (const t of raw.split(" ")) { const [y, md] = t.split(":"); const [m, d] = md.split("-"); o[+y] = [+m, +d]; }
    return o;
  })();
  // Année chinoise (ajustée au Nouvel An lunaire) — base commune animal + élément.
  function chineseYearAdjusted(date) {
    let y = date.getFullYear();
    const cny = CNY[y];
    if (cny) { const m = date.getMonth() + 1, d = date.getDate(); if (m < cny[0] || (m === cny[0] && d < cny[1])) y -= 1; }
    return y;
  }
  function chineseSign(date) { const y = chineseYearAdjusted(date); return CHINESE[((y % 12) + 12) % 12]; }
  // Heure chinoise : chaque signe gouverne une « double-heure » (2 h). Le Rat
  // ouvre le cycle à 23 h. Affine le portrait chinois avec l'heure de naissance.
  const CH_HOUR_ORDER = ["Rat", "Buffle", "Tigre", "Lapin", "Dragon", "Serpent", "Cheval", "Chèvre", "Singe", "Coq", "Chien", "Cochon"];
  function chineseHour(timeStr) {
    if (!timeStr || !/^\d{1,2}:\d{2}/.test(timeStr)) return null;
    const hh = parseInt(timeStr.slice(0, 2), 10);
    if (isNaN(hh)) return null;
    const idx = Math.floor(((hh + 1) % 24) / 2); // 23h/0h → Rat, puis +2 h par signe
    const name = CH_HOUR_ORDER[idx];
    return CHINESE.find((c) => c.name === name) || null;
  }
  // Cinq éléments par dernier chiffre de l'année (tronc céleste).
  const CH_ELEMENTS = ["métal", "métal", "eau", "eau", "bois", "bois", "feu", "feu", "terre", "terre"];
  function chineseElementOf(date) { const y = chineseYearAdjusted(date); return CH_ELEMENTS[((y % 10) + 10) % 10]; }
  // Cycles d'engendrement (harmonie) et de contrôle (tension) des 5 éléments.
  const CH_GEN = { bois: "feu", feu: "terre", terre: "métal", métal: "eau", eau: "bois" };
  const CH_CTRL = { bois: "terre", terre: "eau", eau: "feu", feu: "métal", métal: "bois" };
  function chineseElementScore(a, b) {
    if (!a || !b) return 0.65;
    if (CH_GEN[a] === b || CH_GEN[b] === a) return 0.92; // s'engendrent → nourrissant
    if (a === b) return 0.8;                              // même élément → complices
    if (CH_CTRL[a] === b || CH_CTRL[b] === a) return 0.45; // se contrôlent → friction
    return 0.65;
  }
  const CH_TRINES = [["Rat", "Dragon", "Singe"], ["Buffle", "Serpent", "Coq"], ["Tigre", "Cheval", "Chien"], ["Lapin", "Chèvre", "Cochon"]];
  const CH_FRIENDS = [["Rat", "Buffle"], ["Tigre", "Cochon"], ["Lapin", "Chien"], ["Dragon", "Coq"], ["Serpent", "Singe"], ["Cheval", "Chèvre"]];
  const CH_CLASHES = [["Rat", "Cheval"], ["Buffle", "Chèvre"], ["Tigre", "Singe"], ["Lapin", "Coq"], ["Dragon", "Chien"], ["Serpent", "Cochon"]];
  const inPair = (list, a, b) => list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
  function chineseScore(a, b) {
    if (inPair(CH_FRIENDS, a, b)) return 1.0;
    if (inPair(CH_CLASHES, a, b)) return 0.3;
    if (CH_TRINES.some((t) => t.includes(a) && t.includes(b))) return 0.9;
    return a === b ? 0.72 : 0.6;
  }

  /* ----------------------------- Numérologie ------------------------- */
  function reduceNumber(n, keepMaster = true) {
    while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33)))
      n = String(n).split("").reduce((a, c) => a + +c, 0);
    return n;
  }
  function lifePath(date) {
    const digits = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
    return reduceNumber(digits.split("").reduce((a, c) => a + +c, 0));
  }
  const toSingle = (n) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n);
  const NUM_COMPAT = { 1: [1, 5, 7], 2: [2, 4, 8], 3: [3, 6, 9], 4: [2, 4, 8], 5: [1, 5, 7], 6: [3, 6, 9], 7: [1, 5, 7], 8: [2, 4, 8], 9: [3, 6, 9] };
  function numerologyScore(lp1, lp2) {
    const a = toSingle(lp1), b = toSingle(lp2);
    if (NUM_COMPAT[a] && NUM_COMPAT[a].includes(b)) return a === b ? 0.88 : 1.0;
    const dist = Math.min(Math.abs(a - b), 9 - Math.abs(a - b));
    return 0.45 + ((4 - dist) / 4) * 0.2;
  }

  /* -------------------------------- MBTI ----------------------------- */
  const MBTI_DIM = [
    { same: 0.6, diff: 0.85 }, { same: 1.0, diff: 0.4 },
    { same: 0.6, diff: 0.85 }, { same: 0.65, diff: 0.8 },
  ];
  const MBTI_AXIS_LABEL = ["Énergie (E/I)", "Perception (N/S)", "Décision (T/F)", "Mode de vie (J/P)"];
  function mbtiDetail(t1, t2) {
    if (!t1 || !t2) return null;
    const parts = []; let s = 0;
    for (let i = 0; i < 4; i++) {
      const v = t1[i] === t2[i] ? MBTI_DIM[i].same : MBTI_DIM[i].diff;
      s += v;
      parts.push({ label: MBTI_AXIS_LABEL[i], value: v, same: t1[i] === t2[i] });
    }
    return { value: s / 4, parts };
  }
  function mbtiScore(t1, t2) { const d = mbtiDetail(t1, t2); return d ? d.value : null; }

  /* -------------------------------- BDSM ----------------------------- *
   * Adaptation légère (inspirée de bdsmtest.org) — traits 0..1.
   * La compatibilité récompense la complémentarité des rôles jumeaux. */
  const BDSM_PAIRS = [
    ["dominant", "submissive"], ["sadist", "masochist"], ["rigger", "ropebunny"],
    ["brattamer", "brat"], ["owner", "pet"], ["degrader", "degradee"],
    ["primalhunter", "primalprey"], ["daddy", "little"], ["voyeur", "exhibitionist"],
    // Candaulisme : celui/celle qui montre ↔ celui/celle qui s'expose.
    ["candauliste", "hotwife"],
    // Admirateur·rice ↔ objet du désir (complémentarité miroir).
    ["blackaddict", "blackdesired"], ["bigcock", "hung"],
    // Partage : qui offre sa/son partenaire ↔ l'homme désiré qui la/le reçoit.
    ["blacksharer", "blackdesired"], ["hungsharer", "hung"],
    // Préférences partagées : l'accord se fait quand les deux sont élevés
    // (l'auto-paire récompense les valeurs mutuellement fortes).
    ["polygame", "polygame"], ["asexual", "asexual"], ["hypersexual", "hypersexual"],
    ["daddybaby", "daddybaby"], ["echangiste", "echangiste"],
    // Nouvelles dimensions : goût partagé des fluides, de l'edge play (sans tabou),
    // ou au contraire d'une intimité tendre et classique (vanille).
    ["fluids", "fluids"], ["edgeplay", "edgeplay"], ["vanilla", "vanilla"],
  ];
  function kinkDetail(a, b) {
    if (!a || !b) return null;
    const raw = [];
    for (const [x, y] of BDSM_PAIRS) {
      const ax = a[x] || 0, ay = a[y] || 0, bx = b[x] || 0, by = b[y] || 0;
      // complémentarité dans un sens ou l'autre
      raw.push({ pair: [x, y], value: clamp01(ax * by + ay * bx) });
    }
    // Ouverture partagée (experimental) : deux profils curieux s'entendent.
    const openA = a.experimental || 0, openB = b.experimental || 0;
    const openness = Math.min(openA, openB) * (1 - 0.5 * Math.abs(openA - openB));
    // Les switches augmentent la flexibilité globale.
    const flexMin = Math.min(a.switch || 0, b.switch || 0);
    const flex = 1 + 0.15 * flexMin;
    const core = raw.map((r) => r.value).sort((m, n) => n - m).slice(0, 6).reduce((s, v) => s + v, 0) / 6;
    const value = clamp01((core * 0.72 + openness * 0.28) * flex);
    return {
      value,
      parts: [
        { label: "Complémentarité des rôles", value: core },
        { label: "Ouverture partagée", value: openness },
        { label: "Flexibilité (switch)", value: clamp01(flexMin) },
      ],
      top: raw.filter((r) => r.value > 0.15).sort((m, n) => n.value - m.value).slice(0, 3),
    };
  }
  function bdsmScore(a, b) { const d = kinkDetail(a, b); return d ? d.value : null; }

  /* ------------------- Détails astro d'un profil --------------------- */
  function astroProfile(p) {
    const date = new Date(p.year, p.month - 1, p.day);
    return {
      sun: sunSign(date),
      cusp: cuspInfo(date),
      chinese: chineseSign(date),
      chineseEl: chineseElementOf(date),
      chineseHour: chineseHour(p.time),
      lifePath: lifePath(date),
      ascendant: ascendant(date, p.time, p.zone, p.lat, p.lon),
    };
  }

  /* -------- Détails de compatibilité par item (chacun 0..1) ---------- *
   * Chaque helper renvoie { value, parts:[{label,value}] } pour un calcul
   * transparent et vérifiable, décomposé en sous-critères. */
  // Aspect entre deux signes solaires selon leur écart angulaire (×30°).
  const SIGN_ASPECT = { 0: 0.75, 1: 0.5, 2: 0.85, 3: 0.45, 4: 0.95, 5: 0.5, 6: 0.6 };
  const signGap = (i, j) => { const d = Math.abs(i - j); return Math.min(d, 12 - d); };
  function astroDetail(a, b) {
    const si = ZODIAC.indexOf(a.sun), sj = ZODIAC.indexOf(b.sun);
    const elem = ELEMENT_AFFINITY[a.sun.element][b.sun.element];
    const aspect = SIGN_ASPECT[signGap(si, sj)];
    const parts = [{ label: "Éléments du Soleil", value: elem }, { label: "Aspect solaire", value: aspect }];
    let value;
    if (a.ascendant && b.ascendant) {
      const asc = ELEMENT_AFFINITY[a.ascendant.element][b.ascendant.element];
      parts.push({ label: "Ascendants", value: asc });
      value = 0.45 * elem + 0.25 * aspect + 0.30 * asc;
    } else value = 0.65 * elem + 0.35 * aspect;
    return { value, parts };
  }
  function chineseDetail(a, b) {
    const rel = chineseScore(a.chinese.name, b.chinese.name);
    const el = chineseElementScore(a.chineseEl, b.chineseEl);
    return { value: 0.65 * rel + 0.35 * el, parts: [
      { label: "Relation des signes", value: rel },
      { label: "Éléments chinois", value: el },
    ] };
  }
  function numeroDetail(lp1, lp2) {
    const v = numerologyScore(lp1, lp2);
    return { value: v, parts: [{ label: "Chemins de vie", value: v }] };
  }

  /* --------------------- Compatibilité combinée ---------------------- *
   * Matching précis sur 5 items pondérés (numérologie plafonnée à 10 %).
   * Quand le kink n'est pas renseigné, son poids est redistribué. */
  let WEIGHTS = { mbti: 0.30, astro: 0.25, chinese: 0.15, numero: 0.10, bdsm: 0.20 };
  const WEIGHT_KEYS = ["mbti", "astro", "chinese", "numero", "bdsm"];
  function getWeights() { return { ...WEIGHTS }; }
  function setWeights(w) {
    if (!w) return getWeights();
    for (const k of WEIGHT_KEYS) {
      const v = Number(w[k]);
      if (Number.isFinite(v)) WEIGHTS[k] = Math.max(0, Math.min(1, v));
    }
    return getWeights();
  }
  function compatibility(A, B) {
    const a = astroProfile(A), b = astroProfile(B);
    const factors = [];
    const add = (key, label, emoji, res) => {
      if (!res || res.value == null) return;
      factors.push({ key, label, emoji, weight: WEIGHTS[key], value: res.value, parts: res.parts || [], top: res.top });
    };
    add("mbti", "Personnalité (MBTI)", "🧠", mbtiDetail(A.mbti, B.mbti));
    add("astro", "Astrologie (Soleil + Asc.)", "✨", astroDetail(a, b));
    add("chinese", "Astrologie chinoise", "🐉", chineseDetail(a, b));
    add("numero", "Numérologie", "🔢", numeroDetail(a.lifePath, b.lifePath));
    add("bdsm", "Alchimie kink", "🔥", kinkDetail(A.bdsm, B.bdsm));

    const wsum = factors.reduce((s, f) => s + f.weight, 0) || 1;
    const score = Math.round(factors.reduce((s, f) => s + f.value * (f.weight / wsum), 0) * 100);
    return { score, factors: factors.map((f) => ({ ...f, weight: f.weight / wsum })), a, b };
  }

  function verdict(score) {
    if (score >= 90) return "Une évidence";
    if (score >= 78) return "Une alchimie rare";
    if (score >= 66) return "Beaucoup de potentiel";
    if (score >= 52) return "Des étincelles, quelques défis";
    if (score >= 38) return "Les contraires s'attirent";
    return "Deux mondes à rapprocher";
  }

  global.Engine = {
    ZODIAC, CHINESE, sunSign, ascendant, chineseSign, lifePath, cuspInfo,
    astroProfile, compatibility, verdict, bdsmScore, mbtiScore,
    getWeights, setWeights, WEIGHT_KEYS,
  };
})(typeof window !== "undefined" ? window : globalThis);
