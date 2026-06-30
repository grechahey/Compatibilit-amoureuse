// Règle métier centrale : Éclat ne référence que des biens d'exception.
// Le tarif plancher garantit le positionnement haut de gamme et une
// clientèle qualifiée — d'où un besoin de support et de garanties réduit.
export const MIN_PRICE_PER_NIGHT = 200;

export const BRAND = {
  name: "Éclat",
  tagline: "Locations d'exception",
  baseline: "L'art de séjourner dans des lieux rares.",
};

export const PROPERTY_TYPES = [
  "Villa",
  "Penthouse",
  "Chalet",
  "Domaine",
  "Loft",
  "Manoir",
  "Riad",
  "Appartement",
] as const;

export const AMENITIES = [
  "Piscine privée",
  "Vue mer",
  "Spa & sauna",
  "Salle de sport",
  "Conciergerie 24/7",
  "Chef privé sur demande",
  "Cave à vin",
  "Cheminée",
  "Jardin paysager",
  "Parking sécurisé",
  "Wi-Fi fibre",
  "Climatisation",
  "Home cinéma",
  "Accès plage privé",
  "Héliport",
  "Personnel de maison",
] as const;

// Service fee appliqué au sous-total (réservation).
export const SERVICE_FEE_RATE = 0.08;
