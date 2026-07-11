"use strict";
/* Générateur d'avatars-visages déterministes (SVG).
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

  const SKIN = ["#f8d9c0", "#f1c9a5", "#e5b088", "#d9a066", "#b87a4b", "#8d5a34", "#623d24"];
  const HAIR = ["#2b1d16", "#3f2a1b", "#5c3a21", "#7a4a24", "#a5632c", "#c99a5b", "#e2d2ad", "#efe7d8", "#3a3a3a", "#7d3b3b", "#43357a"];
  const BG = ["#ffe3ec", "#e7f0ff", "#e6f9ea", "#fff3d6", "#f1e7ff", "#ffe7f6", "#e2f6ff"];
  const SHIRT = ["#ff8fb1", "#8fb8ff", "#8fe0b0", "#ffd27a", "#c79bff", "#ff9b9b", "#7ad6e0"];

  // Renvoie une chaîne SVG (viewBox 0 0 100 100).
  function face(seedStr, look) {
    const r = mulberry32(seedFrom(String(seedStr)));
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const o = look || {};
    const skin = o.skin || pick(SKIN);
    const hair = o.hair || pick(HAIR);
    const bg = o.bg || pick(BG);
    const shirt = o.shirt || pick(SHIRT);
    const style = o.hairStyle || pick(["short", "short", "long", "bun", "curly", "buzz", "bald"]);
    const glasses = o.glasses != null ? o.glasses : r() < 0.28;
    const beard = o.beard != null ? o.beard : r() < 0.3;
    const mouth = o.mouth || pick(["smile", "smile", "grin", "soft"]);
    const skinDark = shade(skin, -18);

    let hairSvg = "";
    const cap = `<path d="M24,52 C22,20 78,20 76,52 C68,34 32,34 24,52 Z" fill="${hair}"/>`;
    if (style === "short" || style === "buzz") {
      hairSvg = cap;
      if (style === "buzz") hairSvg = `<path d="M25,50 C24,24 76,24 75,50 C66,38 34,38 25,50 Z" fill="${hair}" opacity="0.9"/>`;
    } else if (style === "long") {
      hairSvg = `<path d="M20,50 C18,22 82,22 80,50 L80,78 C80,82 72,82 72,74 L72,46 C60,36 40,36 28,46 L28,74 C28,82 20,82 20,78 Z" fill="${hair}"/>` + cap;
    } else if (style === "bun") {
      hairSvg = `<circle cx="50" cy="20" r="8" fill="${hair}"/>` + cap;
    } else if (style === "curly") {
      hairSvg = [22, 32, 42, 50, 58, 68, 78].map((x, i) =>
        `<circle cx="${x}" cy="${28 + (i % 2) * 4}" r="9" fill="${hair}"/>`).join("") +
        `<path d="M22,46 C22,30 78,30 78,46 Z" fill="${hair}"/>`;
    } // bald -> ""

    const glassesSvg = glasses
      ? `<g fill="none" stroke="#3a2230" stroke-width="2" opacity="0.85">
           <circle cx="40" cy="52" r="7"/><circle cx="60" cy="52" r="7"/>
           <line x1="47" y1="52" x2="53" y2="52"/></g>`
      : "";
    const beardSvg = beard
      ? `<path d="M30,56 C32,78 68,78 70,56 C66,70 34,70 30,56 Z" fill="${skinDark}"/>`
      : "";
    const mouthSvg = {
      smile: `<path d="M42,64 Q50,70 58,64" fill="none" stroke="${skinDark}" stroke-width="2.4" stroke-linecap="round"/>`,
      grin: `<path d="M42,63 Q50,72 58,63 Z" fill="#fff" stroke="${skinDark}" stroke-width="1.6"/>`,
      soft: `<path d="M44,65 Q50,68 56,65" fill="none" stroke="${skinDark}" stroke-width="2.2" stroke-linecap="round"/>`,
    }[mouth];

    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="avatar">
      <circle cx="50" cy="50" r="50" fill="${bg}"/>
      <path d="M16,100 Q50,70 84,100 Z" fill="${shirt}"/>
      <ellipse cx="26" cy="54" rx="4.5" ry="6.5" fill="${skin}"/>
      <ellipse cx="74" cy="54" rx="4.5" ry="6.5" fill="${skin}"/>
      <path d="M28,50 C28,74 72,74 72,50 C72,34 28,34 28,50 Z" fill="${skin}"/>
      ${beardSvg}
      <ellipse cx="41" cy="52" rx="3" ry="3.4" fill="#fff"/><circle cx="41" cy="52.4" r="1.7" fill="#3a2230"/>
      <ellipse cx="59" cy="52" rx="3" ry="3.4" fill="#fff"/><circle cx="59" cy="52.4" r="1.7" fill="#3a2230"/>
      <path d="M36,45 Q41,42 46,45" fill="none" stroke="${shade(hair, -10)}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M54,45 Q59,42 64,45" fill="none" stroke="${shade(hair, -10)}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M49,54 Q47,59 50,60" fill="none" stroke="${skinDark}" stroke-width="1.6" stroke-linecap="round"/>
      ${mouthSvg}
      ${glassesSvg}
      ${hairSvg}
    </svg>`;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    const c = (x) => Math.max(0, Math.min(255, x));
    return "#" + ((1 << 24) + (c(r) << 16) + (c(g) << 8) + c(b)).toString(16).slice(1);
  }

  global.Avatar = { face };
})(typeof window !== "undefined" ? window : globalThis);
