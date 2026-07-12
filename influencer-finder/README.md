# Influencer Finder — Beauty DACH

Outil de **recherche et qualification d'influenceurs beauté** pour le marché allemand
(Allemagne · Autriche · Suisse), sur **Instagram** et **TikTok**.

C'est une application web autonome : **un seul fichier `index.html`**, aucune installation.
Ouvre-le dans un navigateur (double-clic) ou héberge-le (GitHub Pages, etc.).

## Ce que fait l'outil (v1)

À partir d'un **brief marque** (marque, produit, catégorie beauté, priorité), il :

1. **Note chaque créateur sur 100** selon 5 critères transparents :
   - Pertinence produit (correspondance des thèmes avec la catégorie beauté)
   - Engagement (taux réel comparé au benchmark de sa taille de compte)
   - Audience locale (marché DACH / pays ciblé)
   - Adéquation de taille (nano / micro / mid / macro)
   - Authenticité (détection d'anomalies : engagement trop faible ou suspect)
2. **Classe et filtre** la liste (plateforme, marché, taille, engagement min, score min, recherche).
3. Affiche des **signaux visuels** (✨ match fort, 🚩 engagement faible, ⚠️ à vérifier, ❌ hors niche, 🌍 hors marché).
4. Génère un **message de contact personnalisé en allemand** (3 variantes : coopération payante,
   envoi produit / barter, approche courte).
5. **Exporte la shortlist en CSV** (prête pour Google Sheets).

## Comment l'utiliser

- **Données de démonstration** chargées d'office pour voir l'outil fonctionner.
- **Ses propres données** : bouton « ＋ Importer une liste », coller un CSV avec les colonnes
  `handle,name,platform,followers,avgLikes,avgComments,country,tags,email`.
  (Un bouton « Charger un exemple » montre le format attendu.)

## Le hub « Sourcing » — 4 voies pour trouver des créateurs (toutes gratuites)

Bouton « ✦ Sourcer des créateurs ». Chaque voie alimente le même moteur de qualification.
Détails pas-à-pas dans **[`SOURCING.md`](./SOURCING.md)**.

- **Voie A — Canaux officiels** : TikTok Creator Marketplace + Meta Creator Marketplace
  (gratuits, mais uniquement les créateurs inscrits ≥ 10k abonnés → pas de nano/micro).
- **Voie B — Marketplaces DACH** : ReachHero, eqolot, Reachbird (recherche gratuite, créateurs allemands).
- **Voie C — Premier cercle** : coller les comptes qui taguent/commentent déjà la marque
  (ou ses concurrents) — aucun filtre d'éligibilité, meilleur ROI.
- **Voie D — Recherche web** : un **vivier de ~30 créateurs beauté DACH** compilé depuis des
  sources publiques est intégré, chargeable en un clic (chiffres à vérifier, engagement à enrichir).

Quand l'engagement d'un créateur est inconnu (voies C/D), il est marqué **« à enrichir »** et le
score se calcule sur les autres critères — sans jamais inventer de données.

## Suivi de campagne

Chaque créateur porte un **statut** modifiable directement dans le tableau (menu déroulant
coloré) ou dans sa fiche : **À contacter → Contacté → Répondu → En négociation → Signé**
(ou **Refusé / Sans suite**).

- **Entonnoir** en haut : le nombre de créateurs par étape, **cliquable** pour filtrer.
- **Filtre par statut** dans la barre d'outils.
- **Notes** par créateur (budget proposé, date de relance, conditions) + date de dernière mise à jour.
- **Persistant** (navigateur) et **exporté** dans le CSV (colonnes `statut`, `note`, `suivi_maj`).

## Enrichir l'engagement

Ouvre la fiche d'un créateur → panneau **« Enrichir l'engagement »** :
- colle les **likes/commentaires de ses derniers posts** → moyenne + taux calculés, re-notation en direct ;
- ou **« Estimer (benchmark) »** pour un chiffrage provisoire clairement marqué **« ≈ »** ;
- **« Enregistrer et suivant »** pour enchaîner (compteur « à enrichir » dans la barre d'outils) ;
- tout est **sauvegardé dans le navigateur** et survit aux rechargements.

## Ce que l'outil ne fait PAS

Il ne se connecte pas encore **en direct** aux API d'Instagram/TikTok pour rapatrier
automatiquement les chiffres d'engagement. Ça, c'est la **Phase 2** (nécessite de choisir une
source de données), et le moteur est déjà prêt à la recevoir.

## Feuille de route

- **Phase 1 (fait)** : moteur de qualification + interface + messages allemands + export.
- **Phase 2 (fait)** : hub de sourcing (voies A/B/C/D) + vivier beauté DACH + gestion des
  données d'engagement manquantes.
- **Phase 3 (fait)** : enrichissement de l'engagement (manuel/estimation, persistant) +
  **suivi de campagne** (statut, entonnoir, notes, export). Reste l'enrichissement *automatique*
  (via une source de données) et les données d'audience (âge, genre, pays des abonnés).
- **Content Engine** (outil séparé) : plan marketing automatisé pour la vente de sa propre
  formation (calendrier éditorial IG/TikTok en allemand, tunnel de vente).
