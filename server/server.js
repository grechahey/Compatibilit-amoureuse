"use strict";
/* Serveur Âme Sœur — API REST + fichiers statiques. */
const express = require("express");
const path = require("path");
require("../engine.js");
require("../data.js");
const { Engine, Data } = globalThis;
const D = require("./db.js");

const app = express();
const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
app.use(express.json({ limit: "6mb" }));

/* --------------------------- Utilitaires --------------------------- */
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((c) => {
    const i = c.indexOf("="); if (i > -1) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}
function auth(req, res, next) {
  const token = parseCookies(req).sid;
  const user = D.userForToken(token);
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  req.user = user; next();
}
function setSession(res, userId) {
  const token = D.newSession(userId);
  res.cookie("sid", token, { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 24 * 30 });
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
app.post("/api/register", (req, res) => {
  const { email, password, acceptPrivacy, ageConfirmed } = req.body || {};
  if (!emailOk(email)) return res.status(400).json({ error: "Email invalide." });
  if (!password || password.length < 6) return res.status(400).json({ error: "Mot de passe : 6 caractères minimum." });
  if (!acceptPrivacy) return res.status(400).json({ error: "Vous devez accepter la politique de confidentialité." });
  if (!ageConfirmed) return res.status(400).json({ error: "Vous devez confirmer avoir 18 ans ou plus." });
  if (D.q.userByEmail.get(email.toLowerCase())) return res.status(409).json({ error: "Cet email est déjà inscrit." });
  const id = D.createUser(email, password);
  D.botsSuperLike(id);
  setSession(res, id);
  res.json({ user: { id, email: email.toLowerCase() }, profile: null, credits: D.getCredits(id) });
});
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = email && D.q.userByEmail.get(email.toLowerCase());
  if (!u || u.is_bot || !D.verifyPassword(password || "", u.pw_hash, u.pw_salt))
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  setSession(res, u.id);
  res.json({ user: { id: u.id, email: u.email }, profile: D.profileOut(D.q.getProfile.get(u.id)), credits: D.getCredits(u.id) });
});
app.post("/api/logout", (req, res) => {
  const token = parseCookies(req).sid; if (token) D.q.delSession.run(token);
  res.clearCookie("sid").json({ ok: true });
});
app.get("/api/me", auth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email },
    profile: D.profileOut(D.q.getProfile.get(req.user.id)), credits: D.getCredits(req.user.id) });
});

/* ----------------------------- Profil ------------------------------ */
app.put("/api/profile", auth, (req, res) => {
  const p = req.body || {};
  if (!p.name || !p.year || !p.mbti) return res.status(400).json({ error: "Prénom, date de naissance et MBTI requis." });
  // Données sensibles (Art. 9 RGPD) : consentement explicite obligatoire.
  if (p.bdsm) {
    if (!p.sensitiveConsent) return res.status(400).json({ error: "Le traitement des données kink exige votre consentement explicite." });
    D.stampSensitiveConsent(req.user.id);
  }
  D.saveProfile(req.user.id, p);
  res.json({ profile: D.profileOut(D.q.getProfile.get(req.user.id)) });
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
app.get("/api/discover", auth, (req, res) => {
  const meRow = D.q.getProfile.get(req.user.id);
  if (!meRow) return res.status(400).json({ error: "Complétez votre profil d'abord." });
  const me = D.profileOut(meRow), meE = toEngine(me);
  const ageMin = +req.query.ageMin || 18, ageMax = +req.query.ageMax || 120;
  const dist = req.query.dist ? +req.query.dist : Infinity;
  const swiped = new Set(D.q.swipedTargets.all(req.user.id).map((r) => r.target));
  const superSet = new Set(D.q.superLikers.all(req.user.id).map((r) => r.actor));

  const cands = D.q.allProfiles.all(req.user.id).map(D.profileOut)
    .filter((c) => !swiped.has(c.id) && mutual(me, c))
    .filter((c) => { const a = ageOf(c); return a >= ageMin && a <= ageMax; })
    .filter((c) => { if (dist === Infinity) return true; const d = distanceKm(me, c); return d == null || d <= dist; })
    .map((c) => {
      const r = Engine.compatibility(meE, toEngine(c));
      return {
        id: c.id, name: c.name, age: ageOf(c), city: c.city, distanceKm: distanceKm(me, c),
        mbti: c.mbti, bio: c.bio, avatarSeed: "u" + c.id, score: r.score,
        verdict: Engine.verdict(r.score),
        sun: r.b.sun.emoji, chinese: r.b.chinese.emoji, ascendant: r.b.ascendant ? r.b.ascendant.emoji : null,
        factors: r.factors.map((f) => ({ label: f.label, emoji: f.emoji, value: f.value })),
        bothBdsm: !!(me.bdsm && c.bdsm), superLikedYou: superSet.has(c.id),
      };
    });
  cands.sort((x, y) => (y.superLikedYou - x.superLikedYou) || (y.score - x.score));
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
  const m = D.tryMatch(req.user.id, targetId, kind === "super");
  res.json({ match: !!m, matchId: m ? m.id : null });
});

/* ----------------------------- Matchs ------------------------------ */
function matchView(m, meId) {
  const otherId = m.a === meId ? m.b : m.a;
  const other = D.profileOut(D.q.getProfile.get(otherId));
  const last = D.q.lastMessage.get(m.id);
  return {
    matchId: m.id, superd: !!m.super, avatarSeed: "u" + otherId,
    other: { id: otherId, name: other.name, age: ageOf(other), city: other.city, mbti: other.mbti,
      photo: other.photo, avatar: other.avatar, bio: other.bio },
    lastMessage: last ? { body: last.body, mine: last.sender === meId, at: last.created_at } : null,
  };
}
app.get("/api/matches", auth, (req, res) => {
  const rows = D.q.matchesFor.all(req.user.id, req.user.id);
  res.json({ matches: rows.map((m) => matchView(m, req.user.id)) });
});
app.get("/api/messages/:matchId", auth, (req, res) => {
  const m = D.q.matchById.get(+req.params.matchId);
  if (!m || (m.a !== req.user.id && m.b !== req.user.id)) return res.status(404).json({ error: "Conversation introuvable." });
  res.json({ match: matchView(m, req.user.id), messages: D.q.messagesFor.all(m.id).map((x) => ({ body: x.body, mine: x.sender === req.user.id, at: x.created_at })) });
});
app.post("/api/messages/:matchId", auth, (req, res) => {
  const m = D.q.matchById.get(+req.params.matchId);
  if (!m || (m.a !== req.user.id && m.b !== req.user.id)) return res.status(404).json({ error: "Conversation introuvable." });
  const body = (req.body && req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Message vide." });
  D.q.insMessage.run(m.id, req.user.id, body.slice(0, 800), D.now());
  res.json({ ok: true });
});

/* ----------------------- Message direct (payant) ------------------- */
app.post("/api/message-direct", auth, (req, res) => {
  const { targetId, body } = req.body || {};
  const target = D.q.getProfile.get(targetId);
  if (!target || targetId === req.user.id) return res.status(404).json({ error: "Profil introuvable." });
  const c = D.getCredits(req.user.id);
  if (!c.premium && c.messages <= 0) return res.status(402).json({ error: "Message direct = option premium.", needPremium: "message" });
  const text = (body || "").trim();
  if (!text) return res.status(400).json({ error: "Message vide." });
  if (!c.premium) { c.messages--; D.setCredits(req.user.id, c); }
  const [a, b] = req.user.id < targetId ? [req.user.id, targetId] : [targetId, req.user.id];
  D.q.insMatch.run(a, b, D.now(), 0);
  const m = D.q.matchByPair.get(a, b);
  D.q.insMessage.run(m.id, req.user.id, text.slice(0, 800), D.now());
  res.json({ ok: true, matchId: m.id });
});

/* ------------------------- Achats (simulés) ------------------------ */
app.post("/api/purchase", auth, (req, res) => {
  const c = D.getCredits(req.user.id);
  const plan = req.body && req.body.plan;
  if (plan === "message") c.messages += 1;
  else if (plan === "super") c.superLikes += 5;
  else if (plan === "premium") c.premium = true;
  else return res.status(400).json({ error: "Offre inconnue." });
  D.setCredits(req.user.id, c);
  res.json({ credits: c });
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
app.use(express.static(PUBLIC));
app.get("*", (req, res) => res.sendFile(path.join(PUBLIC, "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Âme Sœur en écoute sur http://localhost:${PORT}`));
