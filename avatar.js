"use strict";
/* Générateur d'avatars-visages déterministes (SVG), stylisés et variés.
 * Donne une impression du physique AVANT la photo — stable par personne. */
(function (global) {
  function seedFrom(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (x) => Math.max(0, Math.min(255, x));
    const r = c((n >> 16) + amt), g = c(((n >> 8) & 255) + amt), b = c((n & 255) + amt);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  const SKIN = ["#fbe0c8", "#f4cda6", "#e8b489", "#d99b6c", "#c07f4f", "#9c6238", "#6f4426"];
  const HAIR = ["#2b1d16", "#3f2a1b", "#5c3a21", "#7a4a24", "#a5632c", "#c99a5b", "#e2d2ad", "#efe7d8", "#3a3a3a", "#8a2f2f", "#43357a", "#2f5f8a"];
  const BG = [["#ffe3ec", "#ffb8d2"], ["#e7f0ff", "#b9d3ff"], ["#e6f9ea", "#b6e6c4"], ["#fff3d6", "#ffe08a"],
    ["#f1e7ff", "#d3b9ff"], ["#ffe7f6", "#ffbfe6"], ["#e2f6ff", "#b6e6f7"], ["#fdeee1", "#ffd3a8"]];
  const CLOTHES = ["#ff8fb1", "#8fb8ff", "#8fe0b0", "#ffd27a", "#c79bff", "#ff9b9b", "#7ad6e0", "#9ad17a"];
  const IRIS = ["#5b3a1e", "#6b4423", "#3f6b8a", "#4a7a52", "#7a6a55", "#37506b"];
  const LIPS = ["#d9738a", "#c9607a", "#cf6f74", "#b85c6e"];

  // Renvoie une chaîne SVG (viewBox 0 0 100 100).
  function face(seedStr, look) {
    const seed = seedFrom(String(seedStr));
    const r = mulberry32(seed);
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const chance = (p) => r() < p;
    const o = look || {};
    const uid = "a" + (seed % 0xffffff).toString(16);

    const skin = o.skin || pick(SKIN);
    const skinSh = shade(skin, -20), skinHi = shade(skin, 14);
    const hair = o.hair || pick(HAIR);
    const hairHi = shade(hair, 26), hairSh = shade(hair, -18);
    const bg = o.bg || pick(BG);
    const clothes = o.clothes || pick(CLOTHES);
    const iris = pick(IRIS);
    const lips = pick(LIPS);
    const style = o.hairStyle || pick(["short", "short", "long", "long", "bun", "curly", "afro", "ponytail", "buzz", "bald", "wavy"]);
    const glasses = o.glasses != null ? o.glasses : chance(0.26);
    const beard = o.beard != null ? o.beard : chance(0.28);
    const stache = beard && chance(0.5);
    const blush = chance(0.5);
    const freckles = chance(0.3);
    const earrings = chance(0.35);
    const brow = pick(["straight", "arch", "soft"]);
    const mouth = o.mouth || pick(["smile", "smile", "grin", "soft"]);
    const eyeShape = pick(["round", "almond"]);

    // ---- Cheveux (couche arrière puis avant) ----
    let hairBack = "", hairFront = "";
    const cap = `<path d="M23,50 C22,20 78,20 77,50 C68,33 32,33 23,50 Z" fill="${hair}"/>
                 <path d="M30,33 C40,26 60,26 70,33 C60,30 40,30 30,33 Z" fill="${hairHi}" opacity=".5"/>`;
    if (style === "short") { hairFront = cap; }
    else if (style === "buzz") { hairFront = `<path d="M25,49 C24,26 76,26 75,49 C66,37 34,37 25,49 Z" fill="${hair}" opacity=".92"/>`; }
    else if (style === "wavy") { hairFront = `<path d="M22,52 C20,22 80,22 78,52 C74,40 70,44 63,38 C56,44 44,44 37,38 C30,44 26,40 22,52 Z" fill="${hair}"/>`; }
    else if (style === "long") {
      hairBack = `<path d="M19,48 C17,20 83,20 81,48 L81,80 C81,85 71,85 71,76 L71,46 C60,35 40,35 29,46 L29,76 C29,85 19,85 19,80 Z" fill="${hair}"/>`;
      hairFront = cap;
    } else if (style === "wavy2") { hairFront = cap; }
    else if (style === "bun") { hairFront = `<circle cx="50" cy="18" r="9" fill="${hair}"/><circle cx="50" cy="18" r="9" fill="${hairHi}" opacity=".25"/>` + cap; }
    else if (style === "ponytail") {
      hairBack = `<path d="M70,40 C86,44 86,66 76,74 C74,64 70,58 66,54 Z" fill="${hair}"/>`;
      hairFront = cap;
    } else if (style === "curly") {
      hairFront = [24, 34, 44, 50, 56, 66, 76].map((x, i) => `<circle cx="${x}" cy="${30 + (i % 2) * 5}" r="9.5" fill="${hair}"/>`).join("") +
        `<path d="M22,46 C22,30 78,30 78,46 Z" fill="${hair}"/>`;
    } else if (style === "afro") {
      hairBack = `<circle cx="50" cy="38" r="34" fill="${hair}"/>`;
      hairFront = [20, 30, 42, 50, 58, 70, 80].map((x, i) => `<circle cx="${x}" cy="${24 + (i % 3) * 3}" r="10" fill="${i % 2 ? hairHi : hair}" opacity="${i % 2 ? .5 : 1}"/>`).join("");
    } // bald -> rien

    const earringSvg = earrings ? `<circle cx="26" cy="61" r="2.2" fill="#ffd86b"/><circle cx="74" cy="61" r="2.2" fill="#ffd86b"/>` : "";
    const blushSvg = blush ? `<ellipse cx="37" cy="58" rx="4.5" ry="2.6" fill="#ff9bb0" opacity=".45"/><ellipse cx="63" cy="58" rx="4.5" ry="2.6" fill="#ff9bb0" opacity=".45"/>` : "";
    const frecklesSvg = freckles ? [[42, 55], [45, 57], [58, 55], [55, 57], [50, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.7" fill="${skinSh}" opacity=".6"/>`).join("") : "";
    const browShape = { straight: "M36,44 L46,43.5", arch: "M36,45 Q41,41 46,44", soft: "M36,44.5 Q41,43 46,44.5" };
    const browsSvg = `<path d="${browShape[brow]}" fill="none" stroke="${hairSh}" stroke-width="2" stroke-linecap="round"/>
                      <path d="${browShape[brow].replace(/36|46|41/g, (m) => ({ 36: 54, 46: 64, 41: 59 }[m]))}" fill="none" stroke="${hairSh}" stroke-width="2" stroke-linecap="round"/>`;
    const eye = (cx) => eyeShape === "round"
      ? `<ellipse cx="${cx}" cy="52" rx="3.4" ry="3.6" fill="#fff"/><circle cx="${cx}" cy="52.3" r="2.1" fill="${iris}"/><circle cx="${cx}" cy="52.3" r="1" fill="#20161d"/><circle cx="${cx - 0.8}" cy="51.3" r="0.7" fill="#fff"/>`
      : `<path d="M${cx - 3.6},52 Q${cx},48.6 ${cx + 3.6},52 Q${cx},55 ${cx - 3.6},52 Z" fill="#fff"/><circle cx="${cx}" cy="52.2" r="2" fill="${iris}"/><circle cx="${cx}" cy="52.2" r="0.95" fill="#20161d"/><circle cx="${cx - 0.7}" cy="51.4" r="0.6" fill="#fff"/>`;
    const mouthSvg = {
      smile: `<path d="M42,64 Q50,70 58,64" fill="none" stroke="${lips}" stroke-width="2.6" stroke-linecap="round"/>`,
      grin: `<path d="M42,63 Q50,71 58,63 Z" fill="#fff" stroke="${lips}" stroke-width="1.6"/><path d="M42,63 Q50,66 58,63" fill="none" stroke="${lips}" stroke-width="1.4"/>`,
      soft: `<path d="M44,65 Q50,68 56,65" fill="none" stroke="${lips}" stroke-width="2.4" stroke-linecap="round"/>`,
    }[mouth];
    const glassesSvg = glasses ? `<g fill="none" stroke="#3a2230" stroke-width="2" opacity=".82">
        <rect x="33" y="48" width="12" height="9" rx="4.5"/><rect x="55" y="48" width="12" height="9" rx="4.5"/>
        <line x1="45" y1="52" x2="55" y2="52"/></g>` : "";
    const beardSvg = beard ? `<path d="M29,55 C31,80 69,80 71,55 C68,72 32,72 29,55 Z" fill="${hairSh}" opacity=".9"/>` : "";
    const stacheSvg = stache ? `<path d="M43,62 Q50,60 57,62 Q50,64 43,62 Z" fill="${hairSh}"/>` : "";

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="avatar">
      <defs>
        <radialGradient id="bg${uid}" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stop-color="${bg[0]}"/><stop offset="100%" stop-color="${bg[1]}"/>
        </radialGradient>
        <linearGradient id="sk${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${skinHi}"/><stop offset="100%" stop-color="${skin}"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#bg${uid})"/>
      <path d="M14,100 Q50,68 86,100 Z" fill="${clothes}"/>
      <path d="M40,100 Q50,86 60,100 Z" fill="${shade(clothes, -22)}" opacity=".5"/>
      <rect x="45" y="70" width="10" height="10" rx="4" fill="${skinSh}"/>
      ${hairBack}
      <ellipse cx="26" cy="55" rx="4.5" ry="6.5" fill="${skin}"/><ellipse cx="74" cy="55" rx="4.5" ry="6.5" fill="${skin}"/>
      ${earringSvg}
      <path d="M28,50 C28,75 72,75 72,50 C72,33 28,33 28,50 Z" fill="url(#sk${uid})"/>
      <path d="M28,50 C28,63 34,72 42,74 C34,70 31,60 31,50 Z" fill="${skinSh}" opacity=".25"/>
      ${beardSvg}${blushSvg}${frecklesSvg}
      ${browsSvg}
      ${eye(41)}${eye(59)}
      <path d="M49,54 Q47,59 50.5,60" fill="none" stroke="${skinSh}" stroke-width="1.5" stroke-linecap="round"/>
      ${stacheSvg}${mouthSvg}
      ${glassesSvg}
      ${hairFront}
    </svg>`;
  }

  global.Avatar = { face };
})(typeof window !== "undefined" ? window : globalThis);
