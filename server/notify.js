"use strict";
/* Notifications — email (SMTP, sinon log en mode démo) et push web (VAPID).
 * Tout est optionnel : sans SMTP les emails sont journalisés ; sans clés VAPID
 * le push est inactif. Aucune dépendance n'est requise pour le mode démo. */
const D = require("./db.js");

/* ------------------------------- Email ----------------------------- */
let mailer = null, mailerTried = false;
function transport() {
  if (mailerTried) return mailer;
  mailerTried = true;
  if (process.env.SMTP_URL) {
    try { mailer = require("nodemailer").createTransport(process.env.SMTP_URL); }
    catch (_) { mailer = null; }
  }
  return mailer;
}
async function sendEmail(to, subject, text) {
  const t = transport();
  if (t) {
    try { await t.sendMail({ from: process.env.MAIL_FROM || "no-reply@amesoeur", to, subject, text }); return { sent: true }; }
    catch (e) { return { sent: false, error: e.message }; }
  }
  console.log(`[notify:email → ${to}] ${subject} :: ${String(text).replace(/\s+/g, " ").trim()}`);
  return { sent: false, demo: true };
}

/* -------------------------------- Push ----------------------------- */
let webpush = null, wpTried = false;
function pusher() {
  if (wpTried) return webpush;
  wpTried = true;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
      webpush = require("web-push");
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@amesoeur.exemple", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    } catch (_) { webpush = null; }
  }
  return webpush;
}
async function sendPush(userId, payload) {
  const wp = pusher(); if (!wp) return;
  for (const s of D.pushSubsFor(userId)) {
    try { await wp.sendNotification(s, JSON.stringify(payload)); }
    catch (e) { if (e && (e.statusCode === 404 || e.statusCode === 410)) D.delPushSub(s.endpoint); }
  }
}
const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null;

/* -------------------- Notification de haut niveau ------------------ */
// Envoie email (si opt-in) + push à un destinataire, sans jamais faire échouer
// la requête appelante (fire-and-forget).
function notify(userId, { subject, text, push }) {
  let u; try { u = D.q.userById.get(userId); } catch (_) { return; }
  if (!u || u.is_bot) return;
  if (u.email && u.notify_email !== 0 && subject) sendEmail(u.email, subject, text).catch(() => {});
  if (push) sendPush(userId, push).catch(() => {});
}

// Anti-spam email pour les messages : 1 email / (destinataire, match) / 15 min.
const lastMsgEmail = new Map();
function messageThrottle(userId, matchId) {
  const key = userId + ":" + matchId, t = Date.now();
  if (t - (lastMsgEmail.get(key) || 0) < 15 * 60 * 1000) return false;
  lastMsgEmail.set(key, t); return true;
}

module.exports = { sendEmail, sendPush, notify, messageThrottle, vapidPublicKey, pushEnabled: () => !!pusher() };
