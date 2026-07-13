"use strict";
/* Avatars humanoïdes déterministes via DiceBear (style « avataaars »).
 * ESM chargé dynamiquement puis mis en cache ; génération synchrone ensuite.
 * - respecte le genre déclaré (coiffures longues/variées pour les femmes,
 *   courtes pour les hommes, mixte pour non-binaire) ;
 * - aucune pilosité faciale imposée (plus de barbe indésirable) ;
 * - teint + couleur de cheveux extraits de la photo (ou choisis à la main) ;
 * - coiffure explicite possible (frisés, afro, locks…) via feat.hairStyle. */
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
const STYLE = process.env.AVATAR_STYLE || "avataaars";
const cache = new Map();
const isHex = (s) => typeof s === "string" && /^[0-9a-fA-F]{6}$/.test(s);

// Coiffures avataaars par présentation de genre (sans chapeaux). Les femmes
// ont par défaut des coiffures nettement LONGUES (les courtes/frisées restent
// accessibles via le sélecteur manuel), les hommes des coiffures courtes.
const FEMALE_TOPS = ["longButNotTooLong", "straight01", "straight02", "straightAndStrand",
  "curly", "curvy", "miaWallace", "bigHair", "dreads", "shaggyMullet"];
const MALE_TOPS = ["shortCurly", "shortFlat", "shortRound", "shortWaved", "sides",
  "theCaesar", "theCaesarAndSidePart", "dreads01", "frizzle", "shaggy"];
// Teintes de cheveux par défaut (bruns naturels) quand aucune couleur n'est
// fournie — évite le rendu blond aléatoire du style.
const DEFAULT_HAIR = ["2c1e16", "4a3627", "3a2a1e", "6b4a2f"];
const ALL_TOPS = [...new Set([...FEMALE_TOPS, ...MALE_TOPS])];
// Coiffures sélectionnables à la main (avec l'intitulé montré côté client).
const HAIR_STYLES = ["shortCurly", "fro", "curly", "dreads", "bob", "bun",
  "longButNotTooLong", "straight02", "shortFlat", "shaggy", "hijab", "turban"];
const topsFor = (gender) => (gender === "F" || gender === "FT") ? FEMALE_TOPS
  : (gender === "H" || gender === "HT") ? MALE_TOPS : ALL_TOPS;

function svgSync(seed, feat, gender) {
  if (!mod) return "";
  const skin = feat && isHex(feat.skinColor) ? feat.skinColor.toLowerCase() : null;
  const hair = feat && isHex(feat.hairColor) ? feat.hairColor.toLowerCase() : null;
  const style = feat && HAIR_STYLES.includes(feat.hairStyle) ? feat.hairStyle : null;
  const key = [seed, skin || "", hair || "", style || "", gender || ""].join("|");
  if (cache.has(key)) return cache.get(key);
  const dstyle = mod.col[STYLE] || mod.col.avataaars;
  const opts = { seed: String(seed), radius: 50, backgroundColor: BG,
    facialHairProbability: 0, accessoriesProbability: 0, topProbability: 100 };
  if (skin) opts.skinColor = [skin];
  opts.hairColor = hair ? [hair] : DEFAULT_HAIR; // jamais de blond par défaut
  opts.top = style ? [style] : topsFor(gender);
  const svg = mod.core.createAvatar(dstyle, opts).toString();
  cache.set(key, svg);
  return svg;
}

module.exports = { ready, svgSync, HAIR_STYLES };
