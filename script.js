"use strict";

/* ------------------------------------------------------------------ *
 *  Âme Sœur — calculateur de compatibilité amoureuse
 *  Tout est déterministe : un même couple donne toujours le même score.
 * ------------------------------------------------------------------ */

const ZODIAC = [
  { name: "Capricorne", emoji: "♑", from: [12, 22], to: [1, 19], element: "terre" },
  { name: "Verseau",    emoji: "♒", from: [1, 20],  to: [2, 18], element: "air" },
  { name: "Poissons",   emoji: "♓", from: [2, 19],  to: [3, 20], element: "eau" },
  { name: "Bélier",     emoji: "♈", from: [3, 21],  to: [4, 19], element: "feu" },
  { name: "Taureau",    emoji: "♉", from: [4, 20],  to: [5, 20], element: "terre" },
  { name: "Gémeaux",    emoji: "♊", from: [5, 21],  to: [6, 20], element: "air" },
  { name: "Cancer",     emoji: "♋", from: [6, 21],  to: [7, 22], element: "eau" },
  { name: "Lion",       emoji: "♌", from: [7, 23],  to: [8, 22], element: "feu" },
  { name: "Vierge",     emoji: "♍", from: [8, 23],  to: [9, 22], element: "terre" },
  { name: "Balance",    emoji: "♎", from: [9, 23],  to: [10, 22], element: "air" },
  { name: "Scorpion",   emoji: "♏", from: [10, 23], to: [11, 21], element: "eau" },
  { name: "Sagittaire", emoji: "♐", from: [11, 22], to: [12, 21], element: "feu" },
];

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

function chineseFor(date) {
  return CHINESE[((date.getFullYear() % 12) + 12) % 12];
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

// Affinités entre éléments (0 → 1)
const ELEMENT_AFFINITY = {
  feu:   { feu: 0.8, terre: 0.45, air: 0.95, eau: 0.4 },
  terre: { feu: 0.45, terre: 0.85, air: 0.5, eau: 0.95 },
  air:   { feu: 0.95, terre: 0.5, air: 0.8, eau: 0.45 },
  eau:   { feu: 0.4, terre: 0.95, air: 0.45, eau: 0.9 },
};

function zodiacFor(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  for (const z of ZODIAC) {
    const [fm, fd] = z.from;
    const [tm, td] = z.to;
    if (fm <= tm) {
      if ((m === fm && d >= fd) || (m === tm && d <= td) || (m > fm && m < tm)) return z;
    } else {
      // signe à cheval sur la nouvelle année (Capricorne)
      if ((m === fm && d >= fd) || (m === tm && d <= td) || m > fm || m < tm) return z;
    }
  }
  return ZODIAC[0];
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
  const c1 = chineseFor(p1.dob);
  const c2 = chineseFor(p2.dob);

  // 1. Affinité astrologique (éléments)
  const astro = ELEMENT_AFFINITY[z1.element][z2.element];

  // 1bis. Astrologie chinoise
  const chinese = chineseScore(c1, c2);

  // 1ter. Compatibilité de personnalité (MBTI)
  const mbti = mbtiScore(p1.mbti, p2.mbti);

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
    { label: "Compatibilité MBTI",    emoji: "🧠", value: mbti },
    { label: "Affinité astrologique", emoji: "✨", value: astro },
    { label: "Astrologie chinoise",   emoji: "🐉", value: chinese },
    { label: "Alchimie des prénoms",  emoji: "🔤", value: names },
    { label: "Étincelle du couple",   emoji: "⚡", value: spark },
    { label: "Rythme de vie",         emoji: "🌙", value: rhythm },
  ];

  const weighted =
    mbti * 0.22 +
    astro * 0.18 +
    chinese * 0.18 +
    names * 0.12 +
    spark * 0.18 +
    rhythm * 0.12;
  const score = Math.round(weighted * 100);

  return { score, factors, z1, z2, c1, c2 };
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
