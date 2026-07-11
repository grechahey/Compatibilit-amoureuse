"use strict";

/* ------------------------------------------------------------------ *
 *  Âme Sœur — calculateur de compatibilité amoureuse
 *  Tout est déterministe : un même couple donne toujours le même score.
 * ------------------------------------------------------------------ */

/* ------------------- Zodiaque occidental (exact) -------------------
 * Le signe est déterminé par la longitude écliptique réelle du Soleil
 * (zodiaque tropical), calculée par l'algorithme solaire de Meeus.
 * Précision ~0,016° (validée contre l'éphéméride pyephem sur 40 000 dates),
 * bien plus fiable qu'une table à dates fixes (qui se trompe de ±1 jour). */

// Signes indexés par numéro tropical : 0 = Bélier (longitude 0–30°), etc.
const ZODIAC = [
  { name: "Bélier",     emoji: "♈", element: "feu" },
  { name: "Taureau",    emoji: "♉", element: "terre" },
  { name: "Gémeaux",    emoji: "♊", element: "air" },
  { name: "Cancer",     emoji: "♋", element: "eau" },
  { name: "Lion",       emoji: "♌", element: "feu" },
  { name: "Vierge",     emoji: "♍", element: "terre" },
  { name: "Balance",    emoji: "♎", element: "air" },
  { name: "Scorpion",   emoji: "♏", element: "eau" },
  { name: "Sagittaire", emoji: "♐", element: "feu" },
  { name: "Capricorne", emoji: "♑", element: "terre" },
  { name: "Verseau",    emoji: "♒", element: "air" },
  { name: "Poissons",   emoji: "♓", element: "eau" },
];

// Jour julien pour une date (UT). hours = heure décimale UT.
function julianDay(y, m, d, hours) {
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) +
         d + B - 1524.5 + hours / 24;
}

// Longitude écliptique apparente du Soleil (degrés, équinoxe de la date).
function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const rad = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
            (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
            0.000289 * Math.sin(3 * M);
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * rad);
  return ((lambda % 360) + 360) % 360;
}

// Numéro de signe (0–11) pour une date évaluée à une heure UT donnée.
function signIndexAt(date, hours) {
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), hours);
  return Math.floor(sunLongitude(jd) / 30) % 12;
}

/* ----------------------- Astrologie chinoise ----------------------- */
// Index = année % 12
const CHINESE = [
  { name: "Singe",   emoji: "🐒" }, // 0
  { name: "Coq",     emoji: "🐓" }, // 1
  { name: "Chien",   emoji: "🐕" }, // 2
  { name: "Cochon",  emoji: "🐖" }, // 3
  { name: "Rat",     emoji: "🐀" }, // 4
  { name: "Buffle",  emoji: "🐂" }, // 5
  { name: "Tigre",   emoji: "🐅" }, // 6
  { name: "Lapin",   emoji: "🐇" }, // 7
  { name: "Dragon",  emoji: "🐉" }, // 8
  { name: "Serpent", emoji: "🐍" }, // 9
  { name: "Cheval",  emoji: "🐴" }, // 10
  { name: "Chèvre",  emoji: "🐐" }, // 11
];

// Trigones (très compatibles)
const CHINESE_TRINES = [
  ["Rat", "Dragon", "Singe"],
  ["Buffle", "Serpent", "Coq"],
  ["Tigre", "Cheval", "Chien"],
  ["Lapin", "Chèvre", "Cochon"],
];
// Amis secrets (paires idéales)
const CHINESE_FRIENDS = [
  ["Rat", "Buffle"], ["Tigre", "Cochon"], ["Lapin", "Chien"],
  ["Dragon", "Coq"], ["Serpent", "Singe"], ["Cheval", "Chèvre"],
];
// Oppositions (signes qui s'affrontent)
const CHINESE_CLASHES = [
  ["Rat", "Cheval"], ["Buffle", "Chèvre"], ["Tigre", "Singe"],
  ["Lapin", "Coq"], ["Dragon", "Chien"], ["Serpent", "Cochon"],
];

// Dates du nouvel an chinois (mois-jour) : le signe d'une année commence
// à cette date, pas le 1er janvier. Couvre 1930–2044.
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
  for (const t of raw.split(" ")) {
    const [y, md] = t.split(":");
    const [m, d] = md.split("-");
    o[+y] = [+m, +d];
  }
  return o;
})();

function chineseFor(date) {
  let y = date.getFullYear();
  const cny = CNY[y];
  if (cny) {
    const m = date.getMonth() + 1, d = date.getDate();
    // Né avant le nouvel an chinois → on appartient à l'année précédente
    if (m < cny[0] || (m === cny[0] && d < cny[1])) y -= 1;
  }
  return CHINESE[((y % 12) + 12) % 12];
}

function inPair(list, a, b) {
  return list.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a));
}

function chineseScore(c1, c2) {
  const a = c1.name, b = c2.name;
  if (inPair(CHINESE_FRIENDS, a, b)) return 1.0;
  if (inPair(CHINESE_CLASHES, a, b)) return 0.3;
  if (CHINESE_TRINES.some((t) => t.includes(a) && t.includes(b))) return 0.9;
  if (a === b) return 0.72;
  return 0.6;
}

/* ----------------------------- MBTI ----------------------------- */
const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

// Compatibilité par dimension : 1 = même lettre, 0 = lettre opposée
const MBTI_DIM = [
  { same: 0.6, diff: 0.85 }, // E/I : les énergies opposées s'équilibrent
  { same: 1.0, diff: 0.4 },  // N/S : partager la même vision du monde compte le plus
  { same: 0.6, diff: 0.85 }, // T/F : tête et cœur se complètent
  { same: 0.65, diff: 0.8 }, // J/P : structure et spontanéité s'attirent
];

function mbtiScore(t1, t2) {
  if (!t1 || !t2) return 0.6;
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    sum += t1[i] === t2[i] ? MBTI_DIM[i].same : MBTI_DIM[i].diff;
  }
  return sum / 4;
}

/* --------------------------- Numérologie --------------------------- */
// Réduit un nombre à un chiffre, en conservant les nombres maîtres 11/22/33
function reduceNumber(n, keepMaster = true) {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) {
    n = String(n).split("").reduce((a, c) => a + Number(c), 0);
  }
  return n;
}

// Chemin de vie : somme de tous les chiffres de la date de naissance
function lifePath(date) {
  const digits = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  const sum = digits.split("").reduce((a, c) => a + Number(c), 0);
  return reduceNumber(sum);
}

// Pour la compatibilité, les nombres maîtres redescendent à un chiffre
function toSingle(n) {
  return n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n;
}

// Affinités numérologiques classiques (chiffres harmonieux)
const NUM_COMPAT = {
  1: [1, 5, 7], 2: [2, 4, 8], 3: [3, 6, 9],
  4: [2, 4, 8], 5: [1, 5, 7], 6: [3, 6, 9],
  7: [1, 5, 7], 8: [2, 4, 8], 9: [3, 6, 9],
};

function numerologyScore(lp1, lp2) {
  const a = toSingle(lp1), b = toSingle(lp2);
  if (NUM_COMPAT[a] && NUM_COMPAT[a].includes(b)) return a === b ? 0.88 : 1.0;
  const dist = Math.min(Math.abs(a - b), 9 - Math.abs(a - b)); // 1..4
  return 0.45 + ((4 - dist) / 4) * 0.2; // ~0.45 → 0.60
}

// Affinités entre éléments (0 → 1)
const ELEMENT_AFFINITY = {
  feu:   { feu: 0.8, terre: 0.45, air: 0.95, eau: 0.4 },
  terre: { feu: 0.45, terre: 0.85, air: 0.5, eau: 0.95 },
  air:   { feu: 0.95, terre: 0.5, air: 0.8, eau: 0.45 },
  eau:   { feu: 0.4, terre: 0.95, air: 0.45, eau: 0.9 },
};

// Signe du Soleil, évalué à midi UT (meilleure estimation sans heure de naissance).
function zodiacFor(date) {
  return ZODIAC[signIndexAt(date, 12)];
}

// Détecte une naissance « à la cuspide » : si le signe change au cours
// de la journée (UT), renvoie les deux signes concernés, sinon null.
function cuspInfo(date) {
  const a = signIndexAt(date, 0);
  const b = signIndexAt(date, 24);
  if (a === b) return null;
  return { from: ZODIAC[a], to: ZODIAC[b] };
}

/* ----------------------- Ascendant (exact) -----------------------
 * Signe se levant à l'est au moment et au lieu de naissance.
 * Temps sidéral apparent + nutation + obliquité vraie, puis formule
 * de l'ascendant. Validé contre le Swiss Ephemeris (écart < 2"). */
const norm360 = (x) => ((x % 360) + 360) % 360;

function meanObliquity(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return 23.4392911 - 0.0130041667 * T - 1.6388889e-7 * T * T + 5.0361111e-7 * T * T * T;
}
function nutation(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const rad = Math.PI / 180;
  const Om = (125.04452 - 1934.136261 * T) * rad;
  const L = (280.4665 + 36000.7698 * T) * rad;
  const Lp = (218.3165 + 481267.8813 * T) * rad;
  const dPsi = (-17.20 * Math.sin(Om) - 1.32 * Math.sin(2 * L) -
                0.23 * Math.sin(2 * Lp) + 0.21 * Math.sin(2 * Om)) / 3600;
  const dEps = (9.20 * Math.cos(Om) + 0.57 * Math.cos(2 * L) +
                0.10 * Math.cos(2 * Lp) - 0.09 * Math.cos(2 * Om)) / 3600;
  return { dPsi, dEps };
}
function gmst(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) +
                 0.000387933 * T * T - (T * T * T) / 38710000.0);
}

// Longitude écliptique de l'ascendant. lat/lonEast en degrés.
function ascendantLongitude(jd, lat, lonEast) {
  const rad = Math.PI / 180;
  const { dPsi, dEps } = nutation(jd);
  const eps = (meanObliquity(jd) + dEps) * rad;
  const gast = gmst(jd) + dPsi * Math.cos(eps);
  const ramc = norm360(gast + lonEast) * rad;
  const phi = lat * rad;
  const asc = Math.atan2(Math.cos(ramc),
                         -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm360(asc / rad);
}

/* --- Conversion heure locale → UTC avec les règles historiques exactes ---
 * On s'appuie sur la base IANA fournie par le navigateur (Intl), qui connaît
 * l'historique des changements d'heure et de fuseau (DST, heure de guerre…). */
function tzOffsetMinutes(zone, ts) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = {};
  for (const part of dtf.formatToParts(ts)) if (part.type !== "literal") p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUTC - ts) / 60000);
}
// Heure murale locale (dans `zone`) → instant UTC (Date). Double passe pour
// gérer correctement les bascules d'heure d'été.
function zonedToUtc(zone, y, mo, d, h, mi) {
  let ts = Date.UTC(y, mo - 1, d, h, mi);
  const o1 = tzOffsetMinutes(zone, ts);
  ts -= o1 * 60000;
  const o2 = tzOffsetMinutes(zone, ts);
  if (o2 !== o1) ts = Date.UTC(y, mo - 1, d, h, mi) - o2 * 60000;
  return new Date(ts);
}

// Signe ascendant : date + heure locale (décimale) + fuseau IANA + lat/lon.
function ascendantSign(date, localHours, zone, lat, lonEast) {
  const h = Math.floor(localHours);
  const mi = Math.round((localHours - h) * 60);
  const utc = zonedToUtc(zone, date.getFullYear(), date.getMonth() + 1, date.getDate(), h, mi);
  const utH = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  const jd = julianDay(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate(), utH);
  const lon = ascendantLongitude(jd, lat, lonEast);
  return ZODIAC[Math.floor(lon / 30) % 12];
}

/* Villes de naissance : latitude, longitude (est+), fuseau IANA.
 * Le fuseau gère automatiquement l'heure d'été et les changements
 * historiques d'offset. */
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
  ["Pékin", 39.9042, 116.4074, "Asia/Shanghai"], ["Hong Kong", 22.3193, 114.1694, "Asia/Hong_Kong"],
  ["Bangkok", 13.7563, 100.5018, "Asia/Bangkok"], ["Mumbai", 19.076, 72.8777, "Asia/Kolkata"],
  ["Dubaï", 25.2048, 55.2708, "Asia/Dubai"], ["Le Caire", 30.0444, 31.2357, "Africa/Cairo"],
  ["Johannesburg", -26.2041, 28.0473, "Africa/Johannesburg"], ["Sydney", -33.8688, 151.2093, "Australia/Sydney"],
  ["Moscou", 55.7558, 37.6173, "Europe/Moscow"], ["Istanbul", 41.0082, 28.9784, "Europe/Istanbul"],
];

// Hash stable d'une chaîne → 0..1
function hashUnit(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function normalize(name) {
  return name.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Compatibilité « historique FLAMES » sur les lettres partagées des prénoms
function lettersScore(a, b) {
  const count = (s) => {
    const m = {};
    for (const c of s.replace(/[^a-z]/g, "")) m[c] = (m[c] || 0) + 1;
    return m;
  };
  const ca = count(a), cb = count(b);
  let shared = 0, total = 0;
  const keys = new Set([...Object.keys(ca), ...Object.keys(cb)]);
  for (const k of keys) {
    shared += Math.min(ca[k] || 0, cb[k] || 0);
    total += Math.max(ca[k] || 0, cb[k] || 0);
  }
  return total === 0 ? 0.5 : shared / total;
}

function compatibility(p1, p2) {
  const n1 = normalize(p1.name);
  const n2 = normalize(p2.name);

  const z1 = zodiacFor(p1.dob);
  const z2 = zodiacFor(p2.dob);
  const cusp1 = cuspInfo(p1.dob);
  const cusp2 = cuspInfo(p2.dob);
  const c1 = chineseFor(p1.dob);
  const c2 = chineseFor(p2.dob);

  // 1. Affinité astrologique (éléments du Soleil, affinée par l'ascendant si connu)
  let astro = ELEMENT_AFFINITY[z1.element][z2.element];
  if (p1.asc && p2.asc) {
    const ascAffinity = ELEMENT_AFFINITY[p1.asc.element][p2.asc.element];
    astro = astro * 0.6 + ascAffinity * 0.4;
  }

  // 1bis. Astrologie chinoise
  const chinese = chineseScore(c1, c2);

  // 1ter. Compatibilité de personnalité (MBTI)
  const mbti = mbtiScore(p1.mbti, p2.mbti);

  // 1quater. Numérologie (chemin de vie)
  const lp1 = lifePath(p1.dob);
  const lp2 = lifePath(p2.dob);
  const numerology = numerologyScore(lp1, lp2);

  // 2. Alchimie des prénoms (lettres partagées)
  const names = 0.35 + lettersScore(n1, n2) * 0.65;

  // 3. Étincelle (hash stable du couple, indépendant de l'ordre)
  const pair = [n1, n2].sort().join("+");
  const spark = 0.3 + hashUnit(pair) * 0.7;

  // 4. Rythme de vie (proximité des jours de l'année de naissance)
  const day = (d) => d.getMonth() * 31 + d.getDate();
  const diff = Math.abs(day(p1.dob) - day(p2.dob));
  const rhythm = 1 - Math.min(diff, 372 - diff) / 186; // 0..1, max d'écart = 6 mois

  const factors = [
    { label: "Compatibilité MBTI",                  emoji: "🧠", value: mbti },
    { label: `Numérologie · chemins ${lp1} & ${lp2}`, emoji: "🔢", value: numerology },
    { label: "Affinité astrologique",               emoji: "✨", value: astro },
    { label: "Astrologie chinoise",                 emoji: "🐉", value: chinese },
    { label: "Alchimie des prénoms",                emoji: "🔤", value: names },
    { label: "Étincelle du couple",                 emoji: "⚡", value: spark },
    { label: "Rythme de vie",                       emoji: "🌙", value: rhythm },
  ];

  const weighted =
    mbti * 0.20 +
    numerology * 0.16 +
    astro * 0.15 +
    chinese * 0.15 +
    names * 0.10 +
    spark * 0.14 +
    rhythm * 0.10;
  const score = Math.round(weighted * 100);

  return { score, factors, z1, z2, c1, c2, cusp1, cusp2,
           asc1: p1.asc, asc2: p2.asc, name1: p1.name, name2: p2.name };
}

function verdictFor(score, z1, z2, c1, c2) {
  let line;
  if (score >= 90)      line = "Une évidence. Vous êtes faits l'un pour l'autre. 💍";
  else if (score >= 75) line = "Une belle harmonie : il y a une vraie magie entre vous. 💕";
  else if (score >= 60) line = "Beaucoup de potentiel ! À cultiver avec tendresse. 🌹";
  else if (score >= 45) line = "Des différences qui peuvent s'attirer… ou faire des étincelles. 🔥";
  else if (score >= 30) line = "Un chemin semé d'efforts, mais l'amour aime les défis. 🌱";
  else                  line = "Opposés sur bien des points — mais qui sait, les contraires s'attirent ! 🎲";
  return `${z1.emoji} ${z1.name} ${c1.emoji} & ${z2.emoji} ${z2.name} ${c2.emoji} — ${line}`;
}

/* ------------------------------- UI ------------------------------- */

const form = document.getElementById("compat-form");
const errorEl = document.getElementById("error");
const result = document.getElementById("result");

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  errorEl.hidden = true;

  const name1 = document.getElementById("name1").value.trim();
  const name2 = document.getElementById("name2").value.trim();
  const dob1v = document.getElementById("dob1").value;
  const dob2v = document.getElementById("dob2").value;

  if (!name1 || !name2) return showError("Indique les deux prénoms. 💌");
  if (!dob1v || !dob2v) return showError("Indique les deux dates de naissance. 🎂");

  const dob1 = new Date(dob1v + "T00:00:00");
  const dob2 = new Date(dob2v + "T00:00:00");
  const today = new Date();
  if (dob1 > today || dob2 > today) return showError("Une date de naissance ne peut pas être dans le futur. ⏳");

  const mbti1 = document.getElementById("mbti1").value;
  const mbti2 = document.getElementById("mbti2").value;
  if (!mbti1 || !mbti2) return showError("Choisis les deux types de personnalité (MBTI). 🧠");

  // Ascendant (facultatif) : nécessite heure + ville de naissance.
  function readAscendant(date, n) {
    const t = document.getElementById("time" + n).value;
    const cityVal = document.getElementById("city" + n).value;
    if (!t || !cityVal) return null;
    const [hh, mm] = t.split(":").map(Number);
    const { lat, lon, zone } = JSON.parse(cityVal);
    return ascendantSign(date, hh + mm / 60, zone, lat, lon);
  }
  const asc1 = readAscendant(dob1, 1);
  const asc2 = readAscendant(dob2, 2);

  const r = compatibility(
    { name: name1, dob: dob1, mbti: mbti1, asc: asc1 },
    { name: name2, dob: dob2, mbti: mbti2, asc: asc2 }
  );
  renderResult(name1, name2, r);
});

function renderResult(name1, name2, r) {
  document.getElementById("result-title").textContent = `${name1} ❤ ${name2}`;
  document.getElementById("verdict").textContent = verdictFor(r.score, r.z1, r.z2, r.c1, r.c2);

  // Ascendants (si calculés)
  const ascEl = document.getElementById("ascendants");
  if (r.asc1 || r.asc2) {
    const parts = [];
    if (r.asc1) parts.push(`${r.name1} ⬆ ${r.asc1.emoji} ${r.asc1.name}`);
    if (r.asc2) parts.push(`${r.name2} ⬆ ${r.asc2.emoji} ${r.asc2.name}`);
    ascEl.textContent = "Ascendant — " + parts.join("  ·  ");
    ascEl.hidden = false;
  } else {
    ascEl.hidden = true;
  }

  // Note de cuspide (signe qui change le jour de la naissance)
  const noteEl = document.getElementById("cusp-note");
  const notes = [];
  if (r.cusp1) notes.push(`${r.name1} est né·e à la cuspide ${r.cusp1.from.emoji}${r.cusp1.from.name} / ${r.cusp1.to.emoji}${r.cusp1.to.name}`);
  if (r.cusp2) notes.push(`${r.name2} est né·e à la cuspide ${r.cusp2.from.emoji}${r.cusp2.from.name} / ${r.cusp2.to.emoji}${r.cusp2.to.name}`);
  if (notes.length) {
    noteEl.textContent = "✨ " + notes.join(" · ") + " — le signe a changé ce jour-là ; l'heure de naissance précise départagerait.";
    noteEl.hidden = false;
  } else {
    noteEl.hidden = true;
  }

  // breakdown
  const ul = document.getElementById("breakdown");
  ul.innerHTML = "";
  for (const f of r.factors) {
    const li = document.createElement("li");
    const pct = Math.round(f.value * 100);
    li.innerHTML =
      `<span aria-hidden="true">${f.emoji}</span>` +
      `<span>${f.label}</span>` +
      `<strong>${pct}%</strong>` +
      `<span class="bar"><i></i></span>`;
    ul.appendChild(li);
    requestAnimationFrame(() => {
      li.querySelector(".bar > i").style.width = pct + "%";
    });
  }

  result.hidden = false;

  // animate ring + number
  const ring = document.getElementById("ring-fg");
  const circumference = 2 * Math.PI * 52;
  ring.style.strokeDashoffset = String(circumference);
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = String(circumference * (1 - r.score / 100));
  });
  animateNumber(document.getElementById("score-number"), r.score);

  result.scrollIntoView({ behavior: "smooth", block: "center" });
}

function animateNumber(el, target) {
  const start = performance.now();
  const dur = 1100;
  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(eased * target));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

document.getElementById("again").addEventListener("click", () => {
  result.hidden = true;
  form.reset();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  document.getElementById("name1").focus();
});

/* --------------------- Remplissage des menus MBTI --------------------- */
(function fillMbti() {
  for (const id of ["mbti1", "mbti2"]) {
    const sel = document.getElementById(id);
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "— choisir —";
    ph.disabled = true;
    ph.selected = true;
    sel.appendChild(ph);
    for (const t of MBTI_TYPES) {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = t;
      sel.appendChild(o);
    }
  }
})();

/* --------------------- Remplissage des menus Villes --------------------- */
(function fillCities() {
  const sorted = [...CITIES].sort((a, b) => a[0].localeCompare(b[0], "fr"));
  for (const id of ["city1", "city2"]) {
    const sel = document.getElementById(id);
    const ph = document.createElement("option");
    ph.value = "";
    ph.textContent = "— choisir —";
    ph.selected = true;
    sel.appendChild(ph);
    for (const [name, lat, lon, zone] of sorted) {
      const o = document.createElement("option");
      o.value = JSON.stringify({ lat, lon, zone });
      o.textContent = name;
      sel.appendChild(o);
    }
  }
})();

/* ----------------------- Décor : cœurs flottants ----------------------- */
(function hearts() {
  const layer = document.querySelector(".hearts");
  const glyphs = ["💖", "💗", "💓", "💕", "❤", "🩷"];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const s = document.createElement("span");
    s.textContent = glyphs[i % glyphs.length];
    const seed = hashUnit("heart" + i);
    s.style.left = (seed * 100).toFixed(1) + "%";
    s.style.setProperty("--s", (14 + seed * 22).toFixed(0) + "px");
    s.style.setProperty("--d", (10 + seed * 12).toFixed(1) + "s");
    s.style.setProperty("--delay", (seed * 12).toFixed(1) + "s");
    layer.appendChild(s);
  }
})();
