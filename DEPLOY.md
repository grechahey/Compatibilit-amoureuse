# Mise en production — guide turnkey

Le code est **prêt à consommer** vos identifiants. Chaque intégration s'active
en renseignant des variables d'environnement (voir `.env.example`). Sans elles,
l'app fonctionne en **mode démo** (crédits simulés, emails affichés à l'écran,
photos stockées en base).

---

## 1. Paiements — Stripe

> À faire dans **votre** compte Stripe (je ne peux pas créer vos clés).

1. Créez un compte sur https://dashboard.stripe.com.
2. **Produits & prix** : créez 3 produits et notez l'ID de prix (`price_...`) de chacun :
   - *Message direct* (paiement unique) → `STRIPE_PRICE_MESSAGE`
   - *Pack 5 Super Likes* (paiement unique) → `STRIPE_PRICE_SUPER`
   - *Premium mensuel* (abonnement) → `STRIPE_PRICE_PREMIUM`
3. **Clé secrète** : Developers → API keys → `STRIPE_SECRET_KEY` (`sk_live_...`).
4. **Webhook** : Developers → Webhooks → endpoint `https://VOTRE_DOMAINE/api/stripe/webhook`,
   événement `checkout.session.completed`. Copiez le *signing secret* → `STRIPE_WEBHOOK_SECRET`.
5. Renseignez le `.env` et redémarrez. `/api/purchase` créera alors une vraie
   session Checkout et les crédits seront attribués par le webhook.

## 2. Emails — SMTP

> À faire chez **votre** fournisseur d'emails (Postmark, Brevo, Mailgun, OVH…).

1. Récupérez une URL SMTP, ex. `smtps://utilisateur:motdepasse@smtp.fournisseur.com:465`.
2. `SMTP_URL=...` et `MAIL_FROM=no-reply@votredomaine.fr`.
3. `npm install nodemailer` (utilisé seulement si `SMTP_URL` est défini).
4. Redémarrez : liens de vérification **et notifications** (nouveau match,
   message, Super Like) partent par email. Sans SMTP, ils sont journalisés.

## 2 ter. Notifications push (Web Push)

1. Générez une paire de clés VAPID : `npx web-push generate-vapid-keys`.
2. `.env` : `VAPID_PUBLIC_KEY=…`, `VAPID_PRIVATE_KEY=…`, `VAPID_SUBJECT=mailto:contact@votredomaine.fr`.
3. `npm install web-push`. Redémarrez.
4. Les membres peuvent alors activer le push depuis leur profil (section
   Notifications). Sans clés VAPID, le push reste simplement inactif.

## 2 bis. Back office admin

1. Dans `.env`, listez les emails autorisés : `ADMIN_EMAILS=vous@votredomaine.fr`
   (plusieurs séparés par des virgules). Vide = back office désactivé.
2. Créez-vous un compte normal dans l'app avec cet email, puis ouvrez **`/admin`**.
3. Vous y trouverez : statistiques marketing (âge, sexe, villes, MBTI,
   inscriptions), liste des membres, **audit détaillé d'un match** entre deux
   membres, et le réglage des **pondérations du matching** (persistées, sans
   redéploiement). Les données sont protégées par `ADMIN_EMAILS`.

## 3. Photos — S3 (ou compatible)

> Fonctionne avec AWS S3, **Cloudflare R2**, Scaleway, Backblaze B2, MinIO.

1. Créez un bucket **privé en écriture / public en lecture** (ou servez via CDN).
2. Créez une clé d'accès (IAM) avec droit `PutObject` sur le bucket.
3. `.env` :
   ```
   S3_BUCKET=amesoeur-photos
   S3_REGION=eu-west-3
   S3_ACCESS_KEY=...
   S3_SECRET_KEY=...
   # R2/MinIO : S3_ENDPOINT=https://<id>.r2.cloudflarestorage.com
   # CDN      : S3_PUBLIC_BASE=https://cdn.votredomaine.fr
   ```
4. Les nouvelles photos sont téléversées et seule leur URL est stockée en base.
   L'hôte est automatiquement ajouté à la CSP `img-src`.

## 4. Hébergement

L'app est un serveur Node (Express) + SQLite. Options :

- **Docker** (voir `Dockerfile`) :
  ```bash
  docker build -t amesoeur .
  docker run -p 3000:3000 -v $PWD/data:/app/data --env-file .env amesoeur
  ```
- **Render / Fly.io / VPS** : `npm ci && npm start` (Node ≥ 22.5). Montez un
  volume persistant sur `data/` pour conserver la base SQLite.
- Mettez `NODE_ENV=production` et `BASE_URL=https://votredomaine.fr` (active le
  cookie `Secure`, HSTS, et les URLs de retour Stripe/vérification).

## 5. Progressive Web App (mobile)

Le site est **installable** (manifest + service worker + icônes). Sur mobile,
« Ajouter à l'écran d'accueil » installe l'app en plein écran. Pour de vraies
**apps natives** (App Store / Play Store), c'est un projet distinct — une base
possible : envelopper cette PWA (Capacitor) ou repartir en React Native en
réutilisant l'API et le moteur.

## 6. Mentions légales & RGPD

L'identité du responsable de traitement est configurable (`ORG_NAME`,
`ORG_LEGAL`, `DPO_EMAIL`, `CONTACT_EMAIL`) et alimente la politique de
confidentialité. ⚠️ Le texte fourni est un socle sérieux mais **doit être
relu par un juriste** avant lancement (il ne constitue pas un conseil juridique).

## 7. À prévoir ensuite pour la grande échelle

PostgreSQL (remplacer SQLite), Redis (rate-limit partagé + temps réel),
WebSockets pour le chat, file d'attente pour les emails, index géo pour la
découverte, i18n multilingue. Voir le README pour le détail.
