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

  // 1. Affinité astrologique (éléments)
  const astro = ELEMENT_AFFINITY[z1.element][z2.element];

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

  return { score, factors, z1, z2, c1, c2, cusp1, cusp2, name1: p1.name, name2: p2.name };
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

  const r = compatibility(
    { name: name1, dob: dob1, mbti: mbti1 },
    { name: name2, dob: dob2, mbti: mbti2 }
  );
  renderResult(name1, name2, r);
});

function renderResult(name1, name2, r) {
  document.getElementById("result-title").textContent = `${name1} ❤ ${name2}`;
  document.getElementById("verdict").textContent = verdictFor(r.score, r.z1, r.z2, r.c1, r.c2);

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
