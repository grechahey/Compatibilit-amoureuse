# Éclat — Locations d'exception

Plateforme de réservation type Airbnb, **réservée aux biens haut de gamme**
(villas, penthouses, chalets, domaines…) et à une clientèle sélectionnée.
Positionnement assumé : tarif plancher de **200 € la nuit**, hôtes et voyageurs
**vérifiés** — d'où un besoin de support et de garanties très réduit.

> Le projet remplace l'ancien dépôt « Compatibilité-amoureuse » (qui ne
> contenait qu'un README).

## ✨ Fonctionnalités

- **Vitrine premium** : page d'accueil éditorialisée, sélection « Éclat »,
  section « concept » expliquant le parti pris haut de gamme.
- **Recherche & filtres** : par destination, nombre de voyageurs, prix, type de
  bien, tri par prix. Le plancher de 200 €/nuit est **toujours appliqué**.
- **Fiche détaillée** : galerie, prestations, hôte vérifié, avis, et widget de
  réservation avec calcul du prix en temps réel (sous-total + frais de service).
- **Authentification** maison (sessions JWT signées en cookie httpOnly), avec
  deux profils : **voyageur** et **hôte**.
- **Espace voyageur** : suivi et annulation des réservations.
- **Espace hôte** : statistiques, publication d'un bien (validation du tarif
  minimum côté serveur), gestion des annonces.
- **Réservations persistées** avec contrôle de **disponibilité** (pas de
  chevauchement de dates) et de **capacité**.

## 🧱 Stack

- [Next.js 14](https://nextjs.org/) (App Router, Server Actions) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) — design system « luxe » sur mesure
- [Prisma](https://www.prisma.io/) + SQLite
- Auth maison : `jose` (JWT) + `bcryptjs`, validation `zod`
- Icônes `lucide-react`

## 🚀 Démarrage

```bash
npm install          # installe les dépendances (et génère le client Prisma)
npm run db:reset     # crée la base SQLite et insère les données de démo
npm run dev          # http://localhost:3000
```

### Comptes de démonstration

Mot de passe commun : `eclat1234`

| Rôle     | E-mail                |
| -------- | --------------------- |
| Voyageur | `client@eclat.com`    |
| Hôte     | `isabelle@eclat.com`  |
| Hôte     | `maxime@eclat.com`    |
| Admin    | `admin@eclat.com`     |

## 🗂️ Structure

```
prisma/
  schema.prisma          # User, Property, Booking, Review
  seed.ts                # 8 biens d'exception (tous ≥ 200 €)
src/
  app/
    page.tsx             # Accueil
    properties/          # Recherche + fiche détaillée
    dashboard/           # Espace voyageur
    host/                # Espace hôte (+ /host/new)
    login/ register/     # Authentification
    actions/             # Server actions (auth, properties, bookings)
  components/             # Navbar, Footer, cartes, formulaires, widget réservation
  lib/                   # prisma, session, constantes (dont MIN_PRICE_PER_NIGHT), utils
scripts/
  setup-prisma-engines.sh
```

La règle métier centrale (`MIN_PRICE_PER_NIGHT = 200`) est définie dans
`src/lib/constants.ts` et appliquée à la fois à la recherche et à la publication.

## 🔧 Environnements réseau restreints (proxy)

Si `prisma generate` échoue avec `ECONNRESET` (le downloader interne de Prisma
n'emprunte pas toujours le proxy HTTPS), récupérez les moteurs via `curl` :

```bash
npm install --ignore-scripts
bash scripts/setup-prisma-engines.sh
# puis exportez les variables affichées avant prisma generate / db:push
```

## 📦 Scripts npm

| Script             | Description                                   |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Serveur de développement                      |
| `npm run build`    | Build de production (`prisma generate` inclus)|
| `npm start`        | Serveur de production                         |
| `npm run db:push`  | Synchronise le schéma avec la base            |
| `npm run db:seed`  | Insère les données de démo                    |
| `npm run db:reset` | Réinitialise puis re-seed la base             |
