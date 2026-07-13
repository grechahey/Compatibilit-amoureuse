"use strict";
/* Avatars humanoïdes déterministes via DiceBear (style « adventurer »).
 * ESM chargé dynamiquement puis mis en cache ; génération synchrone ensuite.
 * L'avatar respecte le genre déclaré (cheveux longs pour les femmes, courts
 * pour les hommes, mixte pour non-binaire) et, si des caractéristiques (teint,
 * cheveux) extraites d'une photo sont fournies, il s'en rapproche.
 * « adventurer » n'a aucune pilosité faciale : plus de barbe indésirable. */
let mod = null, HAIR = null;
async function ready() {
  if (!mod) {
    const core = await import("@dicebear/core");
    const col = await import("@dicebear/collection");
    mod = { core, col };
    computeHair();
  }
  return mod;
}

const BG = ["ece4d9", "e6ded0", "ddd6ea", "d9e2df", "e8dcd9", "e9ddd6"];
// Style d'avatar (DiceBear). Modifiable via AVATAR_STYLE (défaut : adventurer).
const STYLE = process.env.AVATAR_STYLE || "adventurer";
const cache = new Map();
const isHex = (s) => typeof s === "string" && /^[0-9a-fA-F]{6}$/.test(s);

// Répartit les variantes de coiffure du style en « longues » / « courtes ».
function computeHair() {
  try {
    const style = mod.col[STYLE] || mod.col.adventurer;
    const list = style.schema.properties.hair && style.schema.properties.hair.items.enum;
    if (list && list.length) {
      const long = list.filter((h) => /long/i.test(h));
      const short = list.filter((h) => /short/i.test(h));
      HAIR = { long: long.length ? long : list, short: short.length ? short : list, all: list };
    }
  } catch (_) { HAIR = null; }
}
// Jeu de coiffures selon le genre déclaré.
function hairFor(gender) {
  if (!HAIR) return null;
  if (gender === "F" || gender === "FT") return HAIR.long;   // femmes → cheveux longs
  if (gender === "H" || gender === "HT") return HAIR.short;  // hommes → cheveux courts
  return HAIR.all;                                           // non-binaire / inconnu → tout
}

function svgSync(seed, feat, gender) {
  if (!mod) return "";
  const skin = feat && isHex(feat.skinColor) ? feat.skinColor.toLowerCase() : null;
  const hair = feat && isHex(feat.hairColor) ? feat.hairColor.toLowerCase() : null;
  const key = seed + "|" + (skin || "") + "|" + (hair || "") + "|" + (gender || "");
  if (cache.has(key)) return cache.get(key);
  const style = mod.col[STYLE] || mod.col.adventurer;
  const opts = { seed: String(seed), radius: 50, backgroundColor: BG };
  if (skin) opts.skinColor = [skin];
  if (hair) opts.hairColor = [hair];
  const hs = hairFor(gender);
  if (hs) { opts.hair = hs; opts.hairProbability = 100; } // toujours des cheveux
  const svg = mod.core.createAvatar(style, opts).toString();
  cache.set(key, svg);
  return svg;
}

module.exports = { ready, svgSync };
