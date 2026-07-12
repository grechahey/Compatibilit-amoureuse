"use strict";
/* Couche base de données — SQLite (node:sqlite intégré, sans dépendance native). */
const { DatabaseSync } = require("node:sqlite");
const crypto = require("crypto");
const path = require("path");
require("../engine.js");
require("../data.js");
const { Data } = globalThis;

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "amesoeur.db");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  pw_hash TEXT, pw_salt TEXT,
  is_bot INTEGER DEFAULT 0,
  created_at INTEGER,
  consent_at INTEGER, consent_version TEXT, age_confirmed INTEGER DEFAULT 0,
  sensitive_consent_at INTEGER,
  email_verified INTEGER DEFAULT 0, verify_token TEXT
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name TEXT, gender TEXT, seeking TEXT, bio TEXT, avatar TEXT, avatar_feat TEXT, photo TEXT,
  by INTEGER, bm INTEGER, bd INTEGER, btime TEXT, city TEXT,
  mbti TEXT, bdsm TEXT, updated_at INTEGER, discover_photo INTEGER DEFAULT 0, interests TEXT
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter INTEGER, target INTEGER, reason TEXT, created_at INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, expires INTEGER
);
CREATE TABLE IF NOT EXISTS swipes (
  actor INTEGER, target INTEGER, kind TEXT, created_at INTEGER,
  PRIMARY KEY (actor, target)
);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a INTEGER, b INTEGER, created_at INTEGER, super INTEGER DEFAULT 0,
  UNIQUE (a, b)
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  sender INTEGER, body TEXT, created_at INTEGER
);
CREATE TABLE IF NOT EXISTS credits (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  super_likes INTEGER DEFAULT 1, messages INTEGER DEFAULT 0, premium INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT
);
`);

// Migrations défensives (bases existantes créées avant l'ajout du RGPD).
for (const alter of [
  "ALTER TABLE users ADD COLUMN consent_at INTEGER",
  "ALTER TABLE users ADD COLUMN consent_version TEXT",
  "ALTER TABLE users ADD COLUMN age_confirmed INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN sensitive_consent_at INTEGER",
  "ALTER TABLE users ADD COLUMN email_verified INTEGER DEFAULT 0",
  "ALTER TABLE users ADD COLUMN verify_token TEXT",
  "ALTER TABLE profiles ADD COLUMN discover_photo INTEGER DEFAULT 0",
  "ALTER TABLE profiles ADD COLUMN interests TEXT",
  "ALTER TABLE profiles ADD COLUMN avatar_feat TEXT",
]) { try { db.exec(alter); } catch (_) { /* colonne déjà présente */ } }

const CONSENT_VERSION = "2026-07-11";
const now = () => Date.now();

/* ------------------------------- Auth ------------------------------- */
function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  return { hash: h, salt };
}
function verifyPassword(pw, hash, salt) {
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  return h.length === hash.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}

const q = {
  insUser: db.prepare("INSERT INTO users (email, pw_hash, pw_salt, is_bot, created_at) VALUES (?, ?, ?, 0, ?)"),
  userByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  userById: db.prepare("SELECT * FROM users WHERE id = ?"),
  insSession: db.prepare("INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)"),
  sessionByToken: db.prepare("SELECT * FROM sessions WHERE token = ?"),
  delSession: db.prepare("DELETE FROM sessions WHERE token = ?"),
  upsertProfile: db.prepare(`INSERT INTO profiles (user_id,name,gender,seeking,bio,avatar,avatar_feat,photo,by,bm,bd,btime,city,mbti,bdsm,discover_photo,interests,updated_at)
    VALUES (@user_id,@name,@gender,@seeking,@bio,@avatar,@avatar_feat,@photo,@by,@bm,@bd,@btime,@city,@mbti,@bdsm,@discover_photo,@interests,@updated_at)
    ON CONFLICT(user_id) DO UPDATE SET name=@name,gender=@gender,seeking=@seeking,bio=@bio,avatar=@avatar,
      avatar_feat=COALESCE(@avatar_feat,avatar_feat),
      photo=COALESCE(@photo,photo),by=@by,bm=@bm,bd=@bd,btime=@btime,city=@city,mbti=@mbti,bdsm=@bdsm,discover_photo=@discover_photo,interests=@interests,updated_at=@updated_at`),
  getProfile: db.prepare("SELECT p.*, u.is_bot FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.user_id = ?"),
  allProfiles: db.prepare("SELECT p.*, u.is_bot FROM profiles p JOIN users u ON u.id=p.user_id WHERE p.user_id != ?"),
  insSwipe: db.prepare("INSERT OR REPLACE INTO swipes (actor,target,kind,created_at) VALUES (?,?,?,?)"),
  getSwipe: db.prepare("SELECT * FROM swipes WHERE actor=? AND target=?"),
  swipedTargets: db.prepare("SELECT target FROM swipes WHERE actor=?"),
  superLikers: db.prepare("SELECT actor FROM swipes WHERE target=? AND kind='super'"),
  insMatch: db.prepare("INSERT OR IGNORE INTO matches (a,b,created_at,super) VALUES (?,?,?,?)"),
  matchByPair: db.prepare("SELECT * FROM matches WHERE a=? AND b=?"),
  matchesFor: db.prepare("SELECT * FROM matches WHERE a=? OR b=? ORDER BY created_at DESC"),
  matchById: db.prepare("SELECT * FROM matches WHERE id=?"),
  insMessage: db.prepare("INSERT INTO messages (match_id,sender,body,created_at) VALUES (?,?,?,?)"),
  messagesFor: db.prepare("SELECT * FROM messages WHERE match_id=? ORDER BY created_at ASC"),
  lastMessage: db.prepare("SELECT * FROM messages WHERE match_id=? ORDER BY created_at DESC LIMIT 1"),
  getCredits: db.prepare("SELECT * FROM credits WHERE user_id=?"),
  insCredits: db.prepare("INSERT OR IGNORE INTO credits (user_id) VALUES (?)"),
  setCredits: db.prepare("UPDATE credits SET super_likes=?, messages=?, premium=? WHERE user_id=?"),
};

/* ----------------------------- Helpers ------------------------------ */
function createUser(email, password) {
  const { hash, salt } = hashPassword(password);
  const token = crypto.randomBytes(24).toString("hex");
  const info = db.prepare(`INSERT INTO users (email, pw_hash, pw_salt, is_bot, created_at, consent_at, consent_version, age_confirmed, verify_token)
    VALUES (?, ?, ?, 0, ?, ?, ?, 1, ?)`).run(email.toLowerCase(), hash, salt, now(), now(), CONSENT_VERSION, token);
  q.insCredits.run(info.lastInsertRowid);
  return { id: info.lastInsertRowid, token };
}
// Vérification d'email : marque l'utilisateur vérifié à partir de son jeton.
function verifyEmailToken(token) {
  if (!token) return null;
  const u = db.prepare("SELECT * FROM users WHERE verify_token = ?").get(token);
  if (!u) return null;
  db.prepare("UPDATE users SET email_verified = 1, verify_token = NULL WHERE id = ?").run(u.id);
  return u;
}
function regenerateVerifyToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  db.prepare("UPDATE users SET verify_token = ? WHERE id = ? AND email_verified = 0").run(token, userId);
  return token;
}
// Modération : signalement d'un profil (conservé pour revue).
function createReport(reporter, target, reason) {
  db.prepare("INSERT INTO reports (reporter, target, reason, created_at) VALUES (?, ?, ?, ?)")
    .run(reporter, target, String(reason || "").slice(0, 500), now());
  // Le profil signalé est aussi masqué au signaleur (enregistré comme "pass").
  q.insSwipe.run(reporter, target, "pass", now());
}
// Consentement explicite (Art. 9 RGPD) au traitement des données sensibles (kink).
function stampSensitiveConsent(userId) {
  db.prepare("UPDATE users SET sensitive_consent_at = ? WHERE id = ? AND sensitive_consent_at IS NULL").run(now(), userId);
}
// Droit à l'effacement (Art. 17) : suppression complète et irréversible.
function deleteAccount(userId) {
  const matchIds = db.prepare("SELECT id FROM matches WHERE a=? OR b=?").all(userId, userId).map((m) => m.id);
  const delMsg = db.prepare("DELETE FROM messages WHERE match_id=?");
  matchIds.forEach((id) => delMsg.run(id));
  db.prepare("DELETE FROM messages WHERE sender=?").run(userId);
  db.prepare("DELETE FROM matches WHERE a=? OR b=?").run(userId, userId);
  db.prepare("DELETE FROM swipes WHERE actor=? OR target=?").run(userId, userId);
  db.prepare("DELETE FROM sessions WHERE user_id=?").run(userId);
  db.prepare("DELETE FROM credits WHERE user_id=?").run(userId);
  db.prepare("DELETE FROM profiles WHERE user_id=?").run(userId);
  db.prepare("DELETE FROM users WHERE id=?").run(userId);
}
// Droit d'accès et à la portabilité (Art. 15 & 20) : export de toutes les données.
function exportData(userId) {
  const u = db.prepare(`SELECT id, email, created_at, consent_at, consent_version, age_confirmed, sensitive_consent_at
    FROM users WHERE id=?`).get(userId);
  return {
    exportedAt: new Date(now()).toISOString(),
    compte: u,
    profil: profileOut(q.getProfile.get(userId)),
    credits: getCredits(userId),
    swipes: db.prepare("SELECT target, kind, created_at FROM swipes WHERE actor=?").all(userId),
    matches: db.prepare("SELECT id, a, b, created_at, super FROM matches WHERE a=? OR b=?").all(userId, userId),
    messages: db.prepare("SELECT match_id, body, created_at FROM messages WHERE sender=?").all(userId),
  };
}
function newSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  q.insSession.run(token, userId, now() + 1000 * 60 * 60 * 24 * 30);
  return token;
}
function userForToken(token) {
  if (!token) return null;
  const s = q.sessionByToken.get(token);
  if (!s || s.expires < now()) return null;
  return q.userById.get(s.user_id);
}
function saveProfile(userId, p) {
  q.upsertProfile.run({
    user_id: userId, name: p.name, gender: p.gender, seeking: p.seeking, bio: p.bio || "",
    avatar: p.avatar || "⭐", avatar_feat: p.avatarFeat ? JSON.stringify(p.avatarFeat) : null,
    photo: p.photo || null,
    by: p.year, bm: p.month, bd: p.day, btime: p.time || null, city: p.city || null,
    mbti: p.mbti, bdsm: p.bdsm ? JSON.stringify(p.bdsm) : null,
    discover_photo: p.discoverPhoto ? 1 : 0,
    interests: p.interests && p.interests.length ? JSON.stringify(p.interests) : null,
    updated_at: now(),
  });
}
function profileOut(row) {
  if (!row) return null;
  return {
    id: row.user_id, name: row.name, gender: row.gender, seeking: row.seeking, bio: row.bio,
    avatar: row.avatar, avatarFeat: row.avatar_feat ? JSON.parse(row.avatar_feat) : null,
    photo: row.photo, year: row.by, month: row.bm, day: row.bd,
    time: row.btime, city: row.city, mbti: row.mbti, bdsm: row.bdsm ? JSON.parse(row.bdsm) : null,
    discoverPhoto: !!row.discover_photo, interests: row.interests ? JSON.parse(row.interests) : [],
    isBot: !!row.is_bot,
  };
}
// Réglages persistants (ex. pondérations du matching), clé → JSON.
function getSetting(key) {
  const r = db.prepare("SELECT value FROM settings WHERE key=?").get(key);
  if (!r) return null;
  try { return JSON.parse(r.value); } catch (_) { return null; }
}
function setSetting(key, value) {
  db.prepare("INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
    .run(key, JSON.stringify(value));
}
function getCredits(userId) {
  q.insCredits.run(userId);
  const c = q.getCredits.get(userId);
  return { superLikes: c.super_likes, messages: c.messages, premium: !!c.premium };
}
function setCredits(userId, c) {
  q.setCredits.run(c.superLikes, c.messages, c.premium ? 1 : 0, userId);
}

// Crée un match si réciproque. a<b canonique.
function tryMatch(actor, target, isSuper) {
  const reci = q.getSwipe.get(target, actor);
  if (!reci || reci.kind === "pass") return null;
  const [a, b] = actor < target ? [actor, target] : [target, actor];
  q.insMatch.run(a, b, now(), isSuper ? 1 : 0);
  return q.matchByPair.get(a, b);
}

/* --------------------------- Seed des bots -------------------------- */
function seedBots() {
  const existing = db.prepare("SELECT COUNT(*) c FROM users WHERE is_bot=1").get().c;
  if (existing > 0) return;
  const ins = db.prepare("INSERT INTO users (email, is_bot, created_at) VALUES (?, 1, ?)");
  for (const s of Data.SEED) {
    const info = ins.run(`bot+${s.id}@amesoeur.local`, now());
    const uid = info.lastInsertRowid;
    saveProfile(uid, { name: s.name, gender: s.gender, seeking: s.seeking, bio: s.bio, avatar: s.avatar,
      photo: null, year: s.year, month: s.month, day: s.day, time: s.time, city: s.city, mbti: s.mbti,
      bdsm: s.bdsm, interests: s.interests });
  }
}
seedBots();

// Emails des bots qui "super-likent" les nouveaux membres.
const SUPER_BOT_EMAILS = Data.SEED.filter((s) => s.superLikedYou).map((s) => `bot+${s.id}@amesoeur.local`);
// À l'inscription, ces bots déposent un super-like sur le nouvel utilisateur.
function botsSuperLike(userId) {
  for (const email of SUPER_BOT_EMAILS) {
    const bot = q.userByEmail.get(email);
    if (bot) q.insSwipe.run(bot.id, userId, "super", now());
  }
}

module.exports = {
  db, q, now, verifyPassword, CONSENT_VERSION,
  createUser, newSession, userForToken, saveProfile, profileOut,
  getCredits, setCredits, tryMatch, botsSuperLike,
  stampSensitiveConsent, deleteAccount, exportData,
  verifyEmailToken, regenerateVerifyToken, createReport,
  getSetting, setSetting,
};
