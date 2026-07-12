"use strict";
/* Serveur Âme Sœur — API REST + fichiers statiques. */
const express = require("express");
const path = require("path");
require("../engine.js");
require("../data.js");
const { Engine, Data } = globalThis;
const D = require("./db.js");
const Storage = require("./storage.js");
const Avatars = require("./avatars.js");
const Notify = require("./notify.js");

const app = express();
app.set("trust proxy", 1);
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PROD = process.env.NODE_ENV === "production";
const BASE_URL = process.env.BASE_URL || "";

app.use(express.json({ limit: "6mb" }));

/* ----------------------- Sécurité : en-têtes ----------------------- */
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  const imgHost = Storage.publicHost();
  res.setHeader("Content-Security-Policy",
    `default-src 'self'; img-src 'self' data:${imgHost ? " " + imgHost : ""}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    "font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'");
  if (PROD) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
});

/* ----------------- Sécurité : limitation de débit ------------------ */
const rlHits = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.path + "|" + (req.ip || req.socket.remoteAddress || "?");
    const t = D.now();
    const rec = rlHits.get(key) || { count: 0, reset: t + windowMs };
    if (t > rec.reset) { rec.count = 0; rec.reset = t + windowMs; }
    rec.count++; rlHits.set(key, rec);
    if (rec.count > max) return res.status(429).json({ error: "Trop de tentatives, réessayez plus tard." });
    next();
  };
}
if (rlHits.size === 0) setInterval(() => { const t = D.now(); for (const [k, v] of rlHits) if (t > v.reset) rlHits.delete(k); }, 60000).unref();

/* --------------------------- Utilitaires --------------------------- */
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((c) => {
    const i = c.indexOf("="); if (i > -1) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
const lastTouch = new Map();
function touchActivity(userId) {
  const t = Date.now();
  if (t - (lastTouch.get(userId) || 0) < 120000) return; // au plus 1 écriture / 2 min
  lastTouch.set(userId, t); try { D.touchActive(userId); } catch (_) {}
}
function auth(req, res, next) {
  const token = parseCookies(req).sid;
  const user = D.userForToken(token);
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  if (user.banned) return res.status(403).json({ error: "Compte suspendu." });
  req.user = user; touchActivity(user.id); next();
}
function setSession(res, userId) {
  const token = D.newSession(userId);
  res.cookie("sid", token, { httpOnly: true, sameSite: "lax", secure: PROD, maxAge: 1000 * 60 * 60 * 24 * 30 });
}

// Accès admin : réservé aux emails listés dans ADMIN_EMAILS (séparés par des
// virgules). Vide => aucun admin (back office désactivé, sûr par défaut).
const ADMIN_EMAILS = new Set((process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!ADMIN_EMAILS.has((req.user.email || "").toLowerCase()))
      return res.status(403).json({ error: "Accès réservé à l'administration." });
    next();
  });
}

// Restaure les pondérations du matching enregistrées (persistées via l'admin).
try { const w = D.getSetting("matchWeights"); if (w) Engine.setWeights(w); } catch (_) {}

// Envoi de l'email de vérification. Si un SMTP est configuré (nodemailer),
// on l'utilise ; sinon (dev) on renvoie le lien pour pouvoir tester.
async function sendVerificationEmail(email, token) {
  const url = `${BASE_URL}/api/verify?token=${token}`;
  if (process.env.SMTP_URL) {
    try {
      const nodemailer = require("nodemailer");
      const t = nodemailer.createTransport(process.env.SMTP_URL);
      await t.sendMail({ from: process.env.MAIL_FROM || "no-reply@amesoeur", to: email,
        subject: "Confirmez votre adresse — Âme Sœur",
        text: `Bienvenue ! Confirmez votre inscription : ${url}` });
      return { sent: true };
    } catch (e) { return { sent: false, url, error: e.message }; }
  }
  return { sent: false, url }; // mode démo : lien renvoyé au client
}
const toEngine = (p) => {
  const ci = p.city ? Data.CITY_BY_NAME[p.city] : null;
  return { name: p.name, year: p.year, month: p.month, day: p.day, time: p.time || null,
    zone: ci ? ci.zone : null, lat: ci ? ci.lat : null, lon: ci ? ci.lon : null, mbti: p.mbti, bdsm: p.bdsm || null };
};
function ageOf(p) {
  const t = new Date(), b = new Date(p.year, p.month - 1, p.day);
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}
function distanceKm(a, b) {
  const ca = a.city && Data.CITY_BY_NAME[a.city], cb = b.city && Data.CITY_BY_NAME[b.city];
  if (!ca || !cb) return null;
  const R = 6371, dLat = (cb.lat - ca.lat) * Math.PI / 180, dLon = (cb.lon - ca.lon) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(ca.lat * Math.PI / 180) * Math.cos(cb.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}
const mutual = (a, b) => (a.seeking === "T" || a.seeking === b.gender) && (b.seeking === "T" || b.seeking === a.gender);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* ------------------------------ Auth ------------------------------- */
const meView = (u) => ({ user: { id: u.id, email: u.email, emailVerified: !!u.email_verified, notifyEmail: u.notify_email !== 0 },
  profile: D.profileOut(D.q.getProfile.get(u.id)), credits: D.getCredits(u.id) });

app.post("/api/register", rateLimit(15, 15 * 60 * 1000), async (req, res) => {
  const { email, password, acceptPrivacy, ageConfirmed } = req.body || {};
  if (!emailOk(email)) return res.status(400).json({ error: "Email invalide." });
  if (!password || password.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum." });
  if (!acceptPrivacy) return res.status(400).json({ error: "Vous devez accepter la politique de confidentialité." });
  if (!ageConfirmed) return res.status(400).json({ error: "Vous devez confirmer avoir 18 ans ou plus." });
  if (D.q.userByEmail.get(email.toLowerCase())) return res.status(409).json({ error: "Cet email est déjà inscrit." });
  const { id, token } = D.createUser(email, password);
  D.botsSuperLike(id);
  const mail = await sendVerificationEmail(email.toLowerCase(), token);
  setSession(res, id);
  const u = D.q.userById.get(id);
  res.json({ ...meView(u), verifyUrl: mail.sent ? undefined : mail.url });
});
app.post("/api/login", rateLimit(20, 15 * 60 * 1000), (req, res) => {
  const { email, password } = req.body || {};
  const u = email && D.q.userByEmail.get(email.toLowerCase());
  if (!u || u.is_bot || !D.verifyPassword(password || "", u.pw_hash, u.pw_salt))
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  if (u.banned) return res.status(403).json({ error: "Ce compte a été suspendu." });
  setSession(res, u.id);
  res.json(meView(u));
});
app.post("/api/logout", (req, res) => {
  const token = parseCookies(req).sid; if (token) D.q.delSession.run(token);
  res.clearCookie("sid").json({ ok: true });
});
app.get("/api/me", auth, (req, res) => res.json(meView(req.user)));

// Vérification d'email : le lien du mail pointe ici, puis redirige vers l'app.
app.get("/api/verify", (req, res) => {
  const u = D.verifyEmailToken(req.query.token);
  res.redirect(u ? "/?verified=1" : "/?verified=0");
});
app.post("/api/resend-verification", auth, async (req, res) => {
  if (req.user.email_verified) return res.json({ alreadyVerified: true });
  const token = D.regenerateVerifyToken(req.user.id);
  const mail = await sendVerificationEmail(req.user.email, token);
  res.json({ sent: mail.sent, verifyUrl: mail.sent ? undefined : mail.url });
});

/* ----------------------------- Profil ------------------------------ */
const HEX6 = /^[0-9a-fA-F]{6}$/;
// Ne conserve que des couleurs hex valides extraites de la photo (teint, cheveux).
function sanitizeAvatarFeat(f) {
  if (!f || typeof f !== "object") return null;
  const out = {};
  if (HEX6.test(f.skinColor || "")) out.skinColor = String(f.skinColor).toLowerCase();
  if (HEX6.test(f.hairColor || "")) out.hairColor = String(f.hairColor).toLowerCase();
  return out.skinColor || out.hairColor ? out : null;
}

// Aperçu de l'avatar généré (pour un retour visuel immédiat dans le formulaire).
app.post("/api/avatar/preview", auth, async (req, res) => {
  await Avatars.ready();
  const feat = sanitizeAvatarFeat(req.body && req.body.avatarFeat);
  res.json({ svg: Avatars.svgSync("u" + req.user.id, feat) });
});

app.put("/api/profile", auth, async (req, res) => {
  const p = req.body || {};
  if (!p.name || !p.year || !p.mbti) return res.status(400).json({ error: "Prénom, date de naissance et MBTI requis." });
  // Passions : on ne retient que les libellés du catalogue, dédoublonnés, 8 max.
  const valid = new Set(Data.INTERESTS.map(([l]) => l));
  p.interests = Array.isArray(p.interests)
    ? [...new Set(p.interests.filter((x) => valid.has(x)))].slice(0, 8) : [];
  // Avatar généré depuis la photo : on ne garde que des couleurs hex valides.
  p.avatarFeat = sanitizeAvatarFeat(p.avatarFeat);
  // Données sensibles (Art. 9 RGPD) : consentement explicite obligatoire.
  if (p.bdsm) {
    if (!p.sensitiveConsent) return res.status(400).json({ error: "Le traitement des données kink exige votre consentement explicite." });
    D.stampSensitiveConsent(req.user.id);
  }
  // Photo : téléversée sur S3 si configuré, sinon conservée en base (data-URL).
  if (p.photo) {
    try { p.photo = await Storage.storePhoto(p.photo, req.user.id); }
    catch (e) { return res.status(502).json({ error: "Échec du stockage de la photo." }); }
  }
  D.saveProfile(req.user.id, p);
  if (typeof p.notifyEmail === "boolean") D.setNotifyEmail(req.user.id, p.notifyEmail);
  res.json({ profile: D.profileOut(D.q.getProfile.get(req.user.id)) });
});

/* -------------------------- Notifications push --------------------- */
app.get("/api/push/pubkey", auth, (req, res) => res.json({ key: Notify.vapidPublicKey() }));
app.post("/api/push/subscribe", auth, (req, res) => {
  const sub = req.body && req.body.subscription;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: "Abonnement invalide." });
  D.addPushSub(req.user.id, sub);
  res.json({ ok: true });
});
app.post("/api/push/unsubscribe", auth, (req, res) => {
  const ep = req.body && req.body.endpoint;
  if (ep) D.delPushSub(ep);
  res.json({ ok: true });
});

/* --------------------- Vérification de profil ---------------------- */
const GESTURES = ["Levez le pouce 👍", "Faites le signe de la paix ✌️", "Main ouverte près du visage ✋",
  "Faites un cœur avec les mains 🫶", "Touchez votre oreille gauche", "Pouce et index en « OK » 👌"];
const randomGesture = () => GESTURES[Math.floor(Math.random() * GESTURES.length)];
app.get("/api/verification", auth, (req, res) => {
  const me = D.profileOut(D.q.getProfile.get(req.user.id));
  const pending = D.getVerification(req.user.id);
  res.json({ verified: !!(me && me.verified), pending: !!pending, gesture: pending ? pending.gesture : null });
});
app.get("/api/verification/start", auth, (req, res) => res.json({ gesture: randomGesture() }));
app.post("/api/verification", auth, (req, res) => {
  const { selfie, gesture } = req.body || {};
  if (!selfie || !/^data:image\//.test(selfie) || selfie.length > 3000000) return res.status(400).json({ error: "Selfie invalide (image, 3 Mo max)." });
  D.setVerification(req.user.id, selfie, String(gesture || "").slice(0, 80));
  res.json({ pending: true });
});

// Résultats personnels : thème astral, chinois, numérologie, MBTI, kink.
app.get("/api/me/insights", auth, (req, res) => {
  const me = D.profileOut(D.q.getProfile.get(req.user.id));
  if (!me) return res.status(400).json({ error: "Complétez votre profil d'abord." });
  const ap = Engine.astroProfile(toEngine(me));
  res.json({
    sun: ap.sun, cusp: ap.cusp, chinese: ap.chinese, chineseEl: ap.chineseEl, ascendant: ap.ascendant,
    lifePath: ap.lifePath, hasBirthTime: !!(me.time && me.city),
    mbti: me.mbti || null, bdsm: me.bdsm || null,
  });
});

/* ------------------------- Back office admin ----------------------- */
const csvCell = (v) => { const s = v == null ? "" : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
app.get("/api/admin/stats", adminAuth, (req, res) => {
  D.logAdmin(req.user.id, req.user.email, "Tableau de bord consulté", req.ip);
  const one = (sql, ...a) => D.db.prepare(sql).get(...a).c;
  const all = (sql, ...a) => D.db.prepare(sql).all(...a);
  const P = "FROM profiles p JOIN users u ON u.id=p.user_id WHERE u.is_bot=0";
  const births = all(`SELECT p.by y, p.bm m, p.bd d ${P} AND p.by IS NOT NULL`);
  const ageBuckets = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0 };
  for (const b of births) { const a = ageOf({ year: b.y, month: b.m, day: b.d }); ageBuckets[a < 25 ? "18-24" : a < 35 ? "25-34" : a < 45 ? "35-44" : a < 55 ? "45-54" : "55+"]++; }
  res.json({
    users: one("SELECT COUNT(*) c FROM users WHERE is_bot=0"),
    verified: one("SELECT COUNT(*) c FROM users WHERE is_bot=0 AND email_verified=1"),
    withProfile: one(`SELECT COUNT(*) c ${P}`),
    premium: one("SELECT COUNT(*) c FROM credits c JOIN users u ON u.id=c.user_id WHERE u.is_bot=0 AND c.premium=1"),
    matches: one("SELECT COUNT(*) c FROM matches"),
    messages: one("SELECT COUNT(*) c FROM messages"),
    kinkOptin: one(`SELECT COUNT(*) c ${P} AND p.bdsm IS NOT NULL`),
    byGender: all(`SELECT gender k, COUNT(*) c ${P} GROUP BY gender`),
    bySeeking: all(`SELECT seeking k, COUNT(*) c ${P} GROUP BY seeking`),
    byCity: all(`SELECT city k, COUNT(*) c ${P} AND city IS NOT NULL GROUP BY city ORDER BY c DESC LIMIT 12`),
    byMbti: all(`SELECT mbti k, COUNT(*) c ${P} AND mbti IS NOT NULL GROUP BY mbti ORDER BY c DESC`),
    ageBuckets,
    signups: all("SELECT date(created_at/1000,'unixepoch') k, COUNT(*) c FROM users WHERE is_bot=0 AND created_at >= ? GROUP BY k ORDER BY k", D.now() - 30 * 864e5),
  });
});
app.get("/api/admin/users", adminAuth, (req, res) => {
  const limit = Math.min(500, +req.query.limit || 100), offset = Math.max(0, +req.query.offset || 0);
  const rows = D.db.prepare(`SELECT u.id, u.email, u.created_at, u.email_verified,
    p.name, p.gender, p.seeking, p.city, p.mbti, p.by, p.bm, p.bd, (p.bdsm IS NOT NULL) hasKink,
    (SELECT premium FROM credits c WHERE c.user_id=u.id) premium
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id
    WHERE u.is_bot=0 ORDER BY u.created_at DESC LIMIT ? OFFSET ?`).all(limit, offset);
  res.json({
    total: D.db.prepare("SELECT COUNT(*) c FROM users WHERE is_bot=0").get().c, limit, offset,
    users: rows.map((r) => ({
      id: r.id, email: r.email, createdAt: r.created_at, verified: !!r.email_verified,
      name: r.name || null, gender: r.gender || null, seeking: r.seeking || null, city: r.city || null,
      mbti: r.mbti || null, age: r.by ? ageOf({ year: r.by, month: r.bm, day: r.bd }) : null,
      hasKink: !!r.hasKink, premium: !!r.premium,
    })),
  });
});
app.get("/api/admin/members", adminAuth, (req, res) => {
  const rows = D.db.prepare("SELECT u.id, p.name, p.by y, p.bm m, p.bd d FROM users u JOIN profiles p ON p.user_id=u.id ORDER BY p.name").all();
  res.json({ members: rows.map((r) => ({ id: r.id, name: r.name, age: r.y ? ageOf({ year: r.y, month: r.m, day: r.d }) : null })) });
});
// Export CSV des membres (marketing / CRM). Extraction PII → journalisée.
app.get("/api/admin/export.csv", adminAuth, (req, res) => {
  const rows = D.db.prepare(`SELECT u.id, u.email, u.created_at, u.email_verified,
    p.name, p.gender, p.seeking, p.city, p.mbti, p.by, p.bm, p.bd, (p.bdsm IS NOT NULL) hasKink,
    (SELECT premium FROM credits c WHERE c.user_id=u.id) premium
    FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.is_bot=0 ORDER BY u.created_at DESC`).all();
  const G = { F: "Femme", H: "Homme", NB: "Non-binaire" }, S = { T: "Tout le monde", F: "Des femmes", H: "Des hommes" };
  const head = ["id", "email", "prenom", "age", "genre", "recherche", "ville", "mbti", "kink", "premium", "verifie", "inscription"];
  const lines = [head.join(",")];
  for (const r of rows) {
    const age = r.by ? ageOf({ year: r.by, month: r.bm, day: r.bd }) : "";
    lines.push([r.id, r.email, r.name || "", age, G[r.gender] || "", S[r.seeking] || "", r.city || "",
      r.mbti || "", r.hasKink ? "oui" : "non", r.premium ? "oui" : "non", r.email_verified ? "oui" : "non",
      new Date(r.created_at).toISOString().slice(0, 10)].map(csvCell).join(","));
  }
  D.logAdmin(req.user.id, req.user.email, `Export CSV des membres (${rows.length})`, req.ip);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="membres-amesoeur.csv"');
  res.send("﻿" + lines.join("\n")); // BOM pour Excel
});
app.get("/api/admin/log", adminAuth, (req, res) => {
  res.json({ log: D.getAdminLog(150).map((r) => ({ email: r.email, action: r.action, ip: r.ip, at: r.created_at })) });
});
app.get("/api/admin/match", adminAuth, (req, res) => {
  const a = D.profileOut(D.q.getProfile.get(+req.query.a)), b = D.profileOut(D.q.getProfile.get(+req.query.b));
  if (!a || !b) return res.status(404).json({ error: "Profil introuvable." });
  D.logAdmin(req.user.id, req.user.email, `Audit du match : ${a.name} × ${b.name}`, req.ip);
  const r = Engine.compatibility(toEngine(a), toEngine(b));
  res.json({
    a: { id: a.id, name: a.name }, b: { id: b.id, name: b.name },
    score: r.score, verdict: Engine.verdict(r.score),
    factors: r.factors.map((f) => ({
      key: f.key, label: f.label, emoji: f.emoji, weight: Math.round(f.weight * 100), value: Math.round(f.value * 100),
      parts: (f.parts || []).map((p) => ({ label: p.label, value: Math.round(p.value * 100) })),
      top: (f.top || []).map((t) => ({ pair: t.pair, value: Math.round(t.value * 100) })),
    })),
  });
});
app.get("/api/admin/reports", adminAuth, (req, res) => {
  res.json({
    reports: D.adminReports().map((r) => ({
      target: r.target, name: r.name || null, reporters: r.reporters, count: r.n,
      reasons: r.reasons ? r.reasons.split(",") : [], last: r.last, banned: !!r.banned,
      flagged: r.reporters >= 3,
    })),
  });
});
app.get("/api/admin/verifications", adminAuth, (req, res) => {
  res.json({ verifications: D.listVerifications().map((v) => ({ userId: v.user_id, name: v.name || null, photo: v.photo || null, selfie: v.selfie, gesture: v.gesture, at: v.created_at })) });
});
app.post("/api/admin/verify", adminAuth, (req, res) => {
  const userId = +req.body.userId, approve = !!req.body.approve;
  D.resolveVerification(userId, approve);
  D.logAdmin(req.user.id, req.user.email, `${approve ? "Vérification approuvée" : "Vérification rejetée"} du membre #${userId}`, req.ip);
  res.json({ ok: true });
});
app.post("/api/admin/ban", adminAuth, (req, res) => {
  const userId = +req.body.userId, banned = !!req.body.banned;
  const u = D.q.userById.get(userId);
  if (!u || u.is_bot) return res.status(404).json({ error: "Membre introuvable." });
  D.setBanned(userId, banned);
  D.logAdmin(req.user.id, req.user.email, `${banned ? "Bannissement" : "Réactivation"} du membre #${userId} (${u.email})`, req.ip);
  res.json({ ok: true, banned });
});
app.get("/api/admin/weights", adminAuth, (req, res) => res.json({ weights: Engine.getWeights() }));
app.post("/api/admin/weights", adminAuth, (req, res) => {
  const w = Engine.setWeights(req.body || {});
  D.setSetting("matchWeights", w);
  D.logAdmin(req.user.id, req.user.email, `Pondérations modifiées : ${Engine.WEIGHT_KEYS.map((k) => k + "=" + Math.round(w[k] * 100)).join(" ")}`, req.ip);
  res.json({ weights: w });
});

/* ------------------------------ RGPD ------------------------------- */
app.get("/api/gdpr/export", auth, (req, res) => {
  res.setHeader("Content-Disposition", 'attachment; filename="mes-donnees-amesoeur.json"');
  res.json(D.exportData(req.user.id));
});
app.delete("/api/account", auth, (req, res) => {
  const token = parseCookies(req).sid;
  D.deleteAccount(req.user.id);
  if (token) { try { D.q.delSession.run(token); } catch (_) {} }
  res.clearCookie("sid").json({ ok: true });
});

/* ---------------------------- Découvrir ---------------------------- */
app.get("/api/discover", auth, async (req, res) => {
  await Avatars.ready();
  const meRow = D.q.getProfile.get(req.user.id);
  if (!meRow) return res.status(400).json({ error: "Complétez votre profil d'abord." });
  const me = D.profileOut(meRow), meE = toEngine(me);
  const ageMin = +req.query.ageMin || 18, ageMax = +req.query.ageMax || 120;
  const dist = req.query.dist ? +req.query.dist : Infinity;
  const swiped = new Set(D.q.swipedTargets.all(req.user.id).map((r) => r.target));
  const superSet = new Set(D.q.superLikers.all(req.user.id).map((r) => r.actor));

  const blocked = D.blockedSet(req.user.id); // masqués dans les deux sens (modération)
  const flagged = D.flaggedUserIds(3);       // auto-masqués (≥ 3 signaleurs) en attente de revue
  const ACTIVE_MS = 48 * 3600 * 1000, tnow = D.now();
  const cands = D.q.allProfiles.all(req.user.id).map(D.profileOut)
    .filter((c) => !c.banned && !swiped.has(c.id) && !blocked.has(c.id) && !flagged.has(c.id) && mutual(me, c))
    .filter((c) => { const a = ageOf(c); return a >= ageMin && a <= ageMax; })
    .filter((c) => { if (dist === Infinity) return true; const d = distanceKm(me, c); return d == null || d <= dist; })
    .map((c) => {
      const r = Engine.compatibility(meE, toEngine(c));
      return {
        // Première intention : score, ville, âge. Le reste (MBTI, signes,
        // affinités) reste côté serveur et se dévoilera plus tard.
        id: c.id, name: c.name, age: ageOf(c), city: c.city, distanceKm: distanceKm(me, c),
        bio: c.bio, avatarSvg: Avatars.svgSync("u" + c.id, c.avatarFeat), score: r.score,
        superLikedYou: superSet.has(c.id), verified: c.verified,
        activeRecently: !!(c.lastActive && tnow - c.lastActive < ACTIVE_MS),
        _lastActive: c.lastActive || 0, _dist: distanceKm(me, c),
        // Photo montrée en découverte seulement si l'utilisateur l'a choisi.
        photo: c.discoverPhoto && c.photo ? c.photo : null,
      };
    });
  // Tri : les super-likes d'abord, puis selon le critère choisi.
  const sort = req.query.sort;
  const byDist = (a) => (a._dist == null ? Infinity : a._dist);
  const cmp = sort === "distance" ? (x, y) => byDist(x) - byDist(y) || (y.score - x.score)
    : sort === "active" ? (x, y) => (y._lastActive - x._lastActive) || (y.score - x.score)
      : (x, y) => (y.score - x.score);
  cands.sort((x, y) => (y.superLikedYou - x.superLikedYou) || cmp(x, y));
  cands.forEach((c) => { delete c._lastActive; delete c._dist; });
  res.json({ me: { name: me.name }, candidates: cands });
});

/* ------------------------------ Swipe ------------------------------ */
app.post("/api/swipe", auth, (req, res) => {
  const { targetId, kind } = req.body || {};
  if (!["like", "pass", "super"].includes(kind)) return res.status(400).json({ error: "Action invalide." });
  const target = D.q.getProfile.get(targetId);
  if (!target || targetId === req.user.id) return res.status(404).json({ error: "Profil introuvable." });

  if (kind === "super") {
    const c = D.getCredits(req.user.id);
    if (!c.premium && c.superLikes <= 0) return res.status(402).json({ error: "Plus de Super Like.", needPremium: "super" });
    if (!c.premium) { c.superLikes--; D.setCredits(req.user.id, c); }
  }
  D.q.insSwipe.run(req.user.id, targetId, kind, D.now());
  if (kind === "pass") return res.json({ match: false });

  // Réciprocité des bots : ils acceptent selon l'affinité (ou toujours si super-like reçu / super envoyé)
  if (target.is_bot && !D.q.getSwipe.get(targetId, req.user.id)) {
    const r = Engine.compatibility(toEngine(D.profileOut(D.q.getProfile.get(req.user.id))), toEngine(D.profileOut(target)));
    if (kind === "super" || r.score >= 55) D.q.insSwipe.run(targetId, req.user.id, "like", D.now());
  }
  const [pa, pb] = req.user.id < targetId ? [req.user.id, targetId] : [targetId, req.user.id];
  const matchExisted = !!D.q.matchByPair.get(pa, pb);
  const m = D.tryMatch(req.user.id, targetId, kind === "super");
  // Notifications au destinataire (jamais les bots ; match notifié une seule fois).
  if (!target.is_bot) {
    const meName = (D.profileOut(D.q.getProfile.get(req.user.id)) || {}).name || "Quelqu'un";
    if (m && !matchExisted) Notify.notify(targetId, {
      subject: "Vous avez un match ✨ — Âme Sœur",
      text: `${meName} et vous, c'est réciproque ! Ouvrez Âme Sœur pour lancer la conversation. ${BASE_URL}`,
      push: { title: "Nouveau match ✨", body: `${meName} et vous matchez !`, url: "/" },
    });
    else if (kind === "super" && !m) Notify.notify(targetId, {
      subject: "Un Super Like pour vous ⭐ — Âme Sœur",
      text: `${meName} vous a envoyé un Super Like. Découvrez son profil sur Âme Sœur. ${BASE_URL}`,
      push: { title: "Super Like reçu ⭐", body: `${meName} vous a super-liké·e !`, url: "/" },
    });
  }
  res.json({ match: !!m, matchId: m ? m.id : null });
});

/* --------------------------- Modération ---------------------------- */
app.post("/api/report", auth, (req, res) => {
  const { targetId, reason, block } = req.body || {};
  const target = D.q.getProfile.get(targetId);
  if (!target || targetId === req.user.id) return res.status(404).json({ error: "Profil introuvable." });
  D.createReport(req.user.id, targetId, reason);
  if (block) D.addBlock(req.user.id, targetId);
  res.json({ ok: true });
});
app.post("/api/block", auth, (req, res) => {
  const targetId = req.body && +req.body.targetId;
  const target = targetId && D.q.getProfile.get(targetId);
  if (!target || targetId === req.user.id) return res.status(404).json({ error: "Profil introuvable." });
  D.addBlock(req.user.id, targetId);
  res.json({ ok: true });
});

/* ----------------------------- Matchs ------------------------------ */
function matchView(m, meId) {
  const otherId = m.a === meId ? m.b : m.a;
  const other = D.profileOut(D.q.getProfile.get(otherId));
  const last = D.q.lastMessage.get(m.id);
  return {
    matchId: m.id, superd: !!m.super, avatarSvg: Avatars.svgSync("u" + otherId, other.avatarFeat),
    unread: D.matchUnread(meId, m.id),
    other: { id: otherId, name: other.name, age: ageOf(other), city: other.city,
      photo: other.photo, bio: other.bio, verified: other.verified },
    lastMessage: last ? { body: last.body, mine: last.sender === meId, at: last.created_at } : null,
  };
}
app.get("/api/unread", auth, (req, res) => res.json({ count: D.unreadCount(req.user.id) }));

// Révélation progressive des affinités au fil de la conversation (par paliers
// de messages échangés). Rien n'est envoyé au client avant son palier.
const REVEAL_STAGES = [
  { key: "mbti", at: 2, label: "sa personnalité (MBTI)" },
  { key: "signs", at: 5, label: "ses signes astrologiques" },
  { key: "factors", at: 9, label: "le détail de vos affinités" },
];
function buildReveal(me, other, count) {
  const r = Engine.compatibility(toEngine(me), toEngine(other));
  const at = (k) => REVEAL_STAGES.find((s) => s.key === k).at;
  const out = { count, score: r.score, verdict: Engine.verdict(r.score) };
  out.mbti = count >= at("mbti") ? other.mbti : null;
  out.signs = count >= at("signs")
    ? { sun: r.b.sun.name, chinese: r.b.chinese.name, ascendant: r.b.ascendant ? r.b.ascendant.name : null }
    : null;
  out.factors = count >= at("factors")
    ? r.factors.map((f) => ({
      label: f.label, emoji: f.emoji, value: Math.round(f.value * 100), weight: Math.round(f.weight * 100),
      parts: (f.parts || []).map((p) => ({ label: p.label, value: Math.round(p.value * 100) })),
    }))
    : null;
  const nextStage = REVEAL_STAGES.find((s) => count < s.at);
  out.next = nextStage ? { label: nextStage.label, in: nextStage.at - count } : null;
  return out;
}
app.get("/api/matches", auth, async (req, res) => {
  await Avatars.ready();
  const rows = D.q.matchesFor.all(req.user.id, req.user.id);
  res.json({ matches: rows.map((m) => matchView(m, req.user.id)) });
});
app.get("/api/messages/:matchId", auth, async (req, res) => {
  await Avatars.ready();
  const m = D.q.matchById.get(+req.params.matchId);
  if (!m || (m.a !== req.user.id && m.b !== req.user.id)) return res.status(404).json({ error: "Conversation introuvable." });
  const msgs = D.q.messagesFor.all(m.id);
  const otherId = m.a === req.user.id ? m.b : m.a;
  const me = D.profileOut(D.q.getProfile.get(req.user.id)), other = D.profileOut(D.q.getProfile.get(otherId));
  const view = matchView(m, req.user.id);
  D.markRead(req.user.id, m.id); // ouvrir la conversation la marque comme lue
  res.json({
    match: view,
    reveal: buildReveal(me, other, msgs.length),
    messages: msgs.map((x) => ({ body: x.body, mine: x.sender === req.user.id, at: x.created_at })),
  });
});
app.post("/api/messages/:matchId", auth, (req, res) => {
  const m = D.q.matchById.get(+req.params.matchId);
  if (!m || (m.a !== req.user.id && m.b !== req.user.id)) return res.status(404).json({ error: "Conversation introuvable." });
  const otherPeer = m.a === req.user.id ? m.b : m.a;
  if (D.isBlocked(req.user.id, otherPeer)) return res.status(403).json({ error: "Conversation indisponible." });
  const body = (req.body && req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Message vide." });
  D.q.insMessage.run(m.id, req.user.id, body.slice(0, 800), D.now());
  // Notifier le destinataire (email limité à 1/15 min/conversation ; push à chaque fois).
  const otherId = m.a === req.user.id ? m.b : m.a;
  const otherRow = D.q.getProfile.get(otherId);
  if (otherRow && !otherRow.is_bot) {
    const meName = (D.profileOut(D.q.getProfile.get(req.user.id)) || {}).name || "Quelqu'un";
    Notify.notify(otherId, {
      subject: Notify.messageThrottle(otherId, m.id) ? `Nouveau message de ${meName} — Âme Sœur` : null,
      text: `${meName} vous a écrit sur Âme Sœur. ${BASE_URL}`,
      push: { title: `${meName} vous a écrit`, body: body.slice(0, 80), url: "/" },
    });
  }
  res.json({ ok: true });
});

/* ----------------------- Message direct (payant) ------------------- */
app.post("/api/message-direct", auth, (req, res) => {
  const { targetId, body } = req.body || {};
  const target = D.q.getProfile.get(targetId);
  if (!target || targetId === req.user.id) return res.status(404).json({ error: "Profil introuvable." });
  if (D.isBlocked(req.user.id, targetId)) return res.status(403).json({ error: "Envoi impossible." });
  const c = D.getCredits(req.user.id);
  if (!c.premium && c.messages <= 0) return res.status(402).json({ error: "Message direct = option premium.", needPremium: "message" });
  const text = (body || "").trim();
  if (!text) return res.status(400).json({ error: "Message vide." });
  if (!c.premium) { c.messages--; D.setCredits(req.user.id, c); }
  const [a, b] = req.user.id < targetId ? [req.user.id, targetId] : [targetId, req.user.id];
  D.q.insMatch.run(a, b, D.now(), 0);
  const m = D.q.matchByPair.get(a, b);
  D.q.insMessage.run(m.id, req.user.id, text.slice(0, 800), D.now());
  if (!target.is_bot) {
    const meName = (D.profileOut(D.q.getProfile.get(req.user.id)) || {}).name || "Quelqu'un";
    Notify.notify(targetId, {
      subject: `Un message de ${meName} — Âme Sœur`,
      text: `${meName} vous a écrit sur Âme Sœur. ${BASE_URL}`,
      push: { title: `${meName} vous a écrit`, body: text.slice(0, 80), url: "/" },
    });
  }
  res.json({ ok: true, matchId: m.id });
});

/* ---------------------------- Paiements ---------------------------- *
 * Par défaut : crédits simulés (démo). Si des clés Stripe sont fournies
 * (STRIPE_SECRET_KEY + STRIPE_PRICE_*), on crée une vraie session Checkout
 * et le client est redirigé ; les crédits sont attribués via webhook. */
const PLAN_GRANT = { message: (c) => (c.messages += 1), super: (c) => (c.superLikes += 5), premium: (c) => (c.premium = true) };
const stripeConfigured = () => !!process.env.STRIPE_SECRET_KEY;

app.post("/api/purchase", auth, async (req, res) => {
  const plan = req.body && req.body.plan;
  if (!PLAN_GRANT[plan]) return res.status(400).json({ error: "Offre inconnue." });

  if (stripeConfigured()) {
    // --- Chemin production (Stripe) ---
    try {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const priceId = { message: process.env.STRIPE_PRICE_MESSAGE, super: process.env.STRIPE_PRICE_SUPER, premium: process.env.STRIPE_PRICE_PREMIUM }[plan];
      if (!priceId) return res.status(500).json({ error: "Tarif Stripe non configuré pour cette offre." });
      const session = await stripe.checkout.sessions.create({
        mode: plan === "premium" ? "subscription" : "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: String(req.user.id), metadata: { userId: String(req.user.id), plan },
        success_url: `${BASE_URL}/?paid=1`, cancel_url: `${BASE_URL}/?paid=0`,
      });
      return res.json({ checkoutUrl: session.url });
    } catch (e) { return res.status(502).json({ error: "Paiement indisponible : " + e.message }); }
  }

  // --- Chemin démo (aucun paiement réel) ---
  const c = D.getCredits(req.user.id);
  PLAN_GRANT[plan](c);
  D.setCredits(req.user.id, c);
  res.json({ credits: c, simulated: true });
});

// Webhook Stripe : attribue les crédits après paiement confirmé (production).
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).end();
  try {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
    if (event.type === "checkout.session.completed") {
      const s = event.data.object, userId = +s.metadata.userId, plan = s.metadata.plan;
      if (PLAN_GRANT[plan]) { const c = D.getCredits(userId); PLAN_GRANT[plan](c); D.setCredits(userId, c); }
    }
    res.json({ received: true });
  } catch (e) { res.status(400).send("Webhook error: " + e.message); }
});

/* ------------------ Configuration publique (RGPD, etc.) ------------ */
const ORG = {
  name: process.env.ORG_NAME || "Âme Sœur (démo)",
  legal: process.env.ORG_LEGAL || "",
  dpoEmail: process.env.DPO_EMAIL || "dpo@amesoeur.exemple",
  contactEmail: process.env.CONTACT_EMAIL || "contact@amesoeur.exemple",
};
app.get("/api/config", (req, res) => res.json({ org: ORG }));

/* --------------------- Statique + fichiers partagés ---------------- */
["engine.js", "avatar.js", "data.js"].forEach((f) =>
  app.get("/" + f, (req, res) => res.sendFile(path.join(ROOT, f))));
// Back office admin (la page est publique ; les données sont protégées par adminAuth).
app.get("/admin", (req, res) => res.sendFile(path.join(PUBLIC, "admin.html")));
app.use(express.static(PUBLIC));
app.get("*", (req, res) => res.sendFile(path.join(PUBLIC, "index.html")));

const PORT = process.env.PORT || 3000;
Avatars.ready().catch(() => {}); // pré-charge le générateur d'avatars
app.listen(PORT, () => console.log(`Âme Sœur en écoute sur http://localhost:${PORT}`));
