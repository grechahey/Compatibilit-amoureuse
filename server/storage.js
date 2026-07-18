"use strict";
/* Stockage des photos.
 * - Si S3 est configuré (S3_BUCKET + identifiants), on téléverse et on stocke
 *   l'URL publique. Compatible AWS S3 et alternatives (Cloudflare R2, MinIO,
 *   Scaleway, Backblaze…) via S3_ENDPOINT.
 * - Sinon (dev/démo), on conserve la data-URL en base (repli). */
const crypto = require("crypto");

const BUCKET = process.env.S3_BUCKET || "";
const REGION = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
const ENDPOINT = process.env.S3_ENDPOINT || undefined; // pour R2/MinIO/etc.
const PUBLIC_BASE = (process.env.S3_PUBLIC_BASE || "").replace(/\/$/, "");
const ACCESS = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

function isConfigured() { return !!(BUCKET && ACCESS && SECRET); }

// Hôte des photos (à autoriser dans la CSP img-src). Null si non configuré.
function publicHost() {
  if (!isConfigured()) return null;
  try { return new URL(publicUrl("x")).origin; } catch (_) { return null; }
}
function publicUrl(key) {
  if (PUBLIC_BASE) return `${PUBLIC_BASE}/${key}`;
  if (ENDPOINT) return `${ENDPOINT.replace(/\/$/, "")}/${BUCKET}/${key}`;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

let _client = null;
function client() {
  if (_client) return _client;
  const { S3Client } = require("@aws-sdk/client-s3");
  _client = new S3Client({
    region: REGION, endpoint: ENDPOINT, forcePathStyle: !!ENDPOINT,
    credentials: { accessKeyId: ACCESS, secretAccessKey: SECRET },
  });
  return _client;
}

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

// Prend une data-URL (ou une URL déjà stockée) et renvoie une URL à persister.
async function storePhoto(dataUrl, userId) {
  if (!dataUrl || typeof dataUrl !== "string") return dataUrl || null;
  if (!dataUrl.startsWith("data:")) return dataUrl; // déjà une URL → inchangé
  if (!isConfigured()) return dataUrl;               // repli : on garde la data-URL

  const m = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) return dataUrl;
  const mime = m[1] || "image/jpeg";
  const buf = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));
  const key = `photos/${userId}/${crypto.randomBytes(12).toString("hex")}.${EXT[mime] || "jpg"}`;

  const { PutObjectCommand } = require("@aws-sdk/client-s3");
  await client().send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buf, ContentType: mime, CacheControl: "public, max-age=31536000",
  }));
  return publicUrl(key);
}

module.exports = { isConfigured, publicHost, storePhoto };
