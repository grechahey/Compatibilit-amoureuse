"use strict";
/* Avatars humanoïdes déterministes via DiceBear (style « micah »).
 * ESM chargé dynamiquement puis mis en cache ; génération synchrone ensuite.
 * Si des caractéristiques (teint, cheveux) extraites d'une photo sont fournies,
 * l'avatar est personnalisé pour ressembler à la personne. */
let mod = null;
async function ready() {
  if (!mod) {
    const core = await import("@dicebear/core");
    const col = await import("@dicebear/collection");
    mod = { core, col };
  }
  return mod;
}

const BG = ["ece4d9", "e6ded0", "ddd6ea", "d9e2df", "e8dcd9", "e9ddd6"];
// Style d'avatar (DiceBear). Modifiable via AVATAR_STYLE.
const STYLE = process.env.AVATAR_STYLE || "micah";
const cache = new Map();

const isHex = (s) => typeof s === "string" && /^[0-9a-fA-F]{6}$/.test(s);

function svgSync(seed, feat) {
  if (!mod) return "";
  const skin = feat && isHex(feat.skinColor) ? feat.skinColor.toLowerCase() : null;
  const hair = feat && isHex(feat.hairColor) ? feat.hairColor.toLowerCase() : null;
  const key = seed + "|" + (skin || "") + "|" + (hair || "");
  if (cache.has(key)) return cache.get(key);
  const style = mod.col[STYLE] || mod.col.micah;
  const opts = { seed: String(seed), radius: 50, backgroundColor: BG };
  if (skin) opts.baseColor = [skin];
  if (hair) {
    opts.hairColor = [hair]; opts.hairProbability = 100;
    // On exclut le style chauve « mrClean » puisqu'une chevelure a été détectée.
    opts.hair = ["fonze", "mrT", "dougFunny", "dannyPhantom", "full", "turban", "pixie"];
  }
  const svg = mod.core.createAvatar(style, opts).toString();
  cache.set(key, svg);
  return svg;
}

module.exports = { ready, svgSync };
