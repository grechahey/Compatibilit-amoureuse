# Âme Sœur — site de rencontres par affinités profondes

Application de rencontres full-stack qui va au-delà des photos : chaque membre
renseigne sa **naissance** (date, heure, lieu) et passe un test **MBTI** (et,
en option, un test **kink**). Le moteur croise **astrologie** (Soleil +
ascendant, calcul astronomique exact), **astrologie chinoise**, **numérologie**,
**MBTI** et **affinités kink** pour donner une **note de compatibilité** et
classer les profils.

## Fonctionnalités

- **Comptes & authentification** : inscription / connexion, mots de passe
  hachés (scrypt), sessions par cookie httpOnly.
- **Profil** : avatar, bio, genre, recherche, naissance ; tests MBTI (12 Q) et
  kink (16 Q, 18+, facultatif, données sensibles) intégrés.
- **Conformité RGPD** : consentement explicite à l'inscription et pour les
  données sensibles (Art. 9), politique de confidentialité, export des données
  (Art. 15/20), suppression du compte (Art. 17), bandeau cookie strictement
  nécessaire.
- **Découverte en swipe** : note d'abord + **avatar-visage généré** (le physique
  suggéré avant la photo) ; **photos débloquées seulement après un match mutuel**.
- **Filtres** : âge (min/max) et distance (haversine entre villes).
- **Conseils éparpillés** anti-mauvais-critères (allergies, enfants, dépendance
  affective, critères physiques/sexuels trop stricts).
- **Swipe** : passer / ♥ / 💛 super like ; matchs, **messagerie** entre matchs.
- **Options premium (simulées)** : message direct, Super Likes prioritaires,
  abonnement — crédits gérés côté serveur.

## Architecture

```
engine.js        Moteur de compatibilité (partagé client + serveur)
avatar.js        Générateur d'avatars-visages SVG déterministes
data.js          Villes, questionnaires, profils de démo, conseils (partagé)
server/
  db.js          Schéma + accès SQLite (node:sqlite, sans dépendance native)
  server.js      API REST Express + service des fichiers statiques
public/
  index.html     SPA
  styles.css
  app.js         Client (fetch vers l'API REST)
```

Le **moteur astral** est validé contre `pyephem`, le **Swiss Ephemeris** et
`lunardate` (précision < 2″ sur l'ascendant, < 0,02° sur le Soleil).

## Démarrer

Prérequis : **Node.js ≥ 22.5** (pour le module intégré `node:sqlite`).

```bash
npm install
npm start          # http://localhost:3000
```

Variables d'environnement : `PORT` (défaut 3000), `DB_PATH` (défaut
`data/amesoeur.db`). La base et 12 profils de démo sont créés au premier lancement.

## API (REST, JSON, cookie de session)

| Méthode | Route | Rôle |
|--------|-------|------|
| POST | `/api/register`, `/api/login`, `/api/logout` | Authentification |
| GET  | `/api/me` | Session courante (user, profil, crédits) |
| PUT  | `/api/profile` | Créer / mettre à jour son profil |
| GET  | `/api/discover?ageMin&ageMax&dist` | Profils classés par affinité (sans photo) |
| POST | `/api/swipe` | `{targetId, kind: like\|pass\|super}` → match éventuel |
| GET  | `/api/matches` | Ses matchs (photos révélées) |
| GET/POST | `/api/messages/:matchId` | Lire / envoyer des messages |
| POST | `/api/message-direct` | Message sans match (premium) |
| POST | `/api/purchase` | Achat simulé (crédits) |
| GET  | `/api/gdpr/export` | Export RGPD de toutes ses données (JSON) |
| DELETE | `/api/account` | Suppression du compte et effacement total |

## Limites (prototype)

Les paiements sont **simulés** (aucune transaction réelle) et les 12 profils de
démo sont des bots qui répondent selon l'affinité. Pour une mise en production :
passerelle de paiement (Stripe), stockage des photos (S3), vérification email,
modération, conformité RGPD, et une base gérée (PostgreSQL) plutôt que SQLite.
