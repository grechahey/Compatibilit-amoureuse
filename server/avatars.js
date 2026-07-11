"use strict";
/* Avatars humanoïdes déterministes via DiceBear (style « avataaars »).
 * ESM chargé dynamiquement puis mis en cache ; génération synchrone ensuite. */
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
// Style d'avatar (DiceBear). Modifiable via AVATAR_STYLE : adventurer,
// lorelei, micah, avataaars, openPeeps… « adventurer » = humain dessiné, sobre.
const STYLE = process.env.AVATAR_STYLE || "adventurer";
const cache = new Map();

function svgSync(seed) {
  if (!mod) return "";
  if (cache.has(seed)) return cache.get(seed);
  const style = mod.col[STYLE] || mod.col.adventurer;
  const svg = mod.core
    .createAvatar(style, { seed: String(seed), radius: 50, backgroundColor: BG })
    .toString();
  cache.set(seed, svg);
  return svg;
}

module.exports = { ready, svgSync };
