# Playbook de sourcing — trouver des influenceurs beauté DACH (gratuitement)

4 voies pour constituer une liste de créateurs, toutes **gratuites** et **légales**.
Chacune produit une liste que l'on importe ensuite dans l'**Influencer Finder**
(`index.html`) pour la noter, filtrer et générer les messages de contact en allemand.

Format d'import commun (CSV, en-tête) — seules `handle` et `name` sont obligatoires :

```
handle,name,platform,followers,avgLikes,avgComments,country,tags,email,source
```
- `platform` : Instagram / TikTok · `country` : DE / AT / CH
- `tags` : thèmes séparés par « ; » (ex. `skincare;naturkosmetik`)
- `avgLikes` / `avgComments` : laisser à `0` si inconnu → l'engagement sera marqué « à enrichir »

---

## Voie A — Canaux officiels des plateformes

Les outils que TikTok et Meta ont créés pour les marques. Données consenties, gratuites.
**Limite connue** : ne contiennent que les créateurs **inscrits** (sur TikTok : 10 000 abonnés
minimum → nano/micro absents). À utiliser en complément, pas comme source unique.

### TikTok Creator Marketplace — https://creatormarketplace.tiktok.com/
1. Se connecter avec un compte **TikTok Ads Manager** (gratuit, aucun minimum d'abonnés côté marque).
2. Onglet **Find creators** → filtrer par **pays** (Germany / Austria / Switzerland),
   **thème** (Beauty), taille d'audience, démographie.
3. Exporter / noter les handles retenus → les mettre au format CSV ci-dessus (`source = Canal officiel`).

### Meta / Instagram Creator Marketplace — https://www.facebook.com/business/ads/creator-marketplace
1. Depuis le **compte professionnel Instagram** ou le Meta Business Suite.
2. Découvrir des créateurs par thème + pays, et voir ceux qui **taguent/mentionnent déjà** la marque.
3. Reporter les handles au format CSV (`source = Canal officiel`).

## Voie B — Marketplaces DACH

Plateformes allemandes où les créateurs s'inscrivent eux-mêmes (coordonnées souvent fournies).
Recherche **gratuite** pour les marques.

| Plateforme | URL | Note |
|-----------|-----|------|
| ReachHero | https://www.reachhero.de/ | 70 000+ influenceurs, recherche gratuite |
| eqolot | https://eqolot.com/ | 45 000+, orienté marques allemandes |
| Reachbird | https://www.reachbird.io/ | Munich, DACH |
| Dogfluence | — | gratuit, commission seulement sur deal |

→ Chercher « Beauty / Kosmetik », filtrer par pays, exporter, importer (`source = Marketplace DACH`).

## Voie C — Premier cercle (ambassadeurs organiques)

Souvent le **meilleur ROI** : les gens qui aiment déjà la marque convertissent le mieux,
et il n'y a **aucun filtre d'éligibilité** (nano/micro compris).

**Où les trouver (manuel, gratuit) :**
- Personnes qui **taguent** le compte de la marque, ou l'identifient en story.
- Auteurs des **commentaires** récurrents et enthousiastes.
- Personnes qui utilisent les **hashtags** de la marque.
- Mêmes actions sur les comptes des **marques concurrentes** (audience déjà qualifiée).

**Dans l'outil** : bouton « ✦ Sourcer des créateurs » → voie C → coller les comptes repérés
(handle + nom suffisent). L'engagement restera « à enrichir » jusqu'à vérification.

## Voie D — Recherche web assistée

Un **vivier de démarrage** de ~30 créateurs beauté DACH est déjà intégré dans l'outil
(bouton « Sourcer » → voie D → « Charger le vivier »). Il a été compilé depuis des sources
publiques (Kolsquare, Favikon, Clickanalytic, InfluData, StarNgage, OMR…).

⚠️ Les nombres d'abonnés sont des **ordres de grandeur publics à vérifier**, et l'engagement
n'est pas renseigné (à enrichir). C'est un point de départ, pas une base validée.

Pour l'étendre : reprendre la même méthode (rechercher « beste beauty influencer Deutschland »,
« naturkosmetik influencer », « österreichische beauty tiktoker »…), extraire les handles des
classements, et compléter le CSV.

---

## Enrichir l'engagement (les données manquantes)

Les voies C et D donnent l'**identité** (qui + niche + taille), pas l'engagement.
Pour renseigner `avgLikes` / `avgComments` :
- **À la main** : ouvrir le profil, faire la moyenne des likes/commentaires sur ~6 posts récents.
- **Semi-automatique** : dès qu'une source de données est choisie (Phase 2), on remplit ces
  colonnes automatiquement.

## Note RGPD (marché allemand)

Contacter des créateurs à des fins B2B repose sur l'**intérêt légitime** (art. 6-1-f RGPD),
mais en Allemagne la prudence est de mise :
- N'utiliser que des **coordonnées professionnelles publiques** (email business/PR affiché, lien « Kooperation »).
- Message de contact **pertinent** et **non massif**, avec possibilité claire de se désinscrire.
- Ne pas stocker de données personnelles au-delà du nécessaire.
Ce fichier et l'outil servent à organiser une prospection ciblée, pas de l'emailing de masse.
