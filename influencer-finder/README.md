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

## Ce que la v1 ne fait PAS encore

L'outil ne va **pas** chercher tout seul les influenceurs sur Instagram/TikTok : il **qualifie**
les données qu'on lui fournit. La collecte automatique des créateurs (Phase 2) nécessite de
choisir une **source de données** :

| Voie | Coût indicatif | Légalité | Qualité |
|------|----------------|----------|---------|
| API tierce (Modash, HypeAuditor, Phyllo, TikTok Creator Marketplace) | ~50–300 €/mois | ✅ propre | démographie, faux followers… |
| Scraping (Apify, EnsembleData) | ~30–100 €/mois | ⚠️ zone grise (CGU) | correct mais fragile |
| Semi-manuel | gratuit | ✅ | dépend de ce qu'on colle |

Le moteur de scoring est déjà conçu pour brancher n'importe laquelle de ces sources ensuite
(il suffit d'alimenter la liste de créateurs au même format).

## Feuille de route

- **Phase 1 (fait)** : moteur de qualification + interface + messages allemands + export.
- **Phase 2** : connecter une source de données pour la découverte automatique des créateurs.
- **Phase 3** : suivi de campagne (comptes contactés, réponses, statut), et données d'audience
  (âge, genre, pays des abonnés) pour affiner le ciblage.
- **Content Engine** (outil séparé) : plan marketing automatisé pour la vente de sa propre
  formation (calendrier éditorial IG/TikTok en allemand, tunnel de vente).
