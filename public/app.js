"use strict";
/* Client Âme Sœur — parle à l'API REST (comptes, profils, swipe, messages). */
(function () {
  const $ = (id) => document.getElementById(id);
  const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const BDSM_LABELS = {
    dominant: "Dominant·e", submissive: "Soumis·e", sadist: "Sadique", masochist: "Masochiste",
    rigger: "Attacheur·se", ropebunny: "Attaché·e", brattamer: "Dresseur·se", brat: "Rebelle",
    owner: "Maître/sse", pet: "Animal", daddy: "Protecteur·rice", little: "Tendre",
    voyeur: "Voyeur·se", exhibitionist: "Exhib.", experimental: "Explorateur·rice", switch: "Switch",
    degrader: "Humiliant·e", degradee: "Humilié·e", primalhunter: "Primal chasseur", primalprey: "Primal proie",
    candauliste: "Candauliste", hotwife: "Hotwife", polygame: "Polygame", blackaddict: "Black addict",
    bigcock: "Big cock addict", asexual: "Asexuel·le", hypersexual: "Hypersexuel·le", daddybaby: "Daddy/Baby",
  };

  async function api(path, opts = {}) {
    const res = await fetch("/api" + path, {
      method: opts.method || "GET", credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Erreur"), { status: res.status, data });
    return data;
  }

  let S = { user: null, profile: null, credits: { superLikes: 1, messages: 0, premium: false } };
  let CONFIG = { org: { name: "Âme Sœur", dpoEmail: "dpo@amesoeur.exemple", legal: "" } };
  let tempMbti = null, tempBdsm = null, pendingPhoto = null, devVerifyUrl = null, pendingAvatarFeat = null;
  let candidates = [], deck = [], pos = 0;
  let authMode = "register";
  let currentChat = null;
  const filters = { ageMin: 18, ageMax: 80, dist: 2050 };

  /* ============================ Boot ============================ */
  document.addEventListener("DOMContentLoaded", async () => {
    initControls(); initFilters(); initAuth(); initMatches(); initRgpd(); initPhoto();
    $("quiz-form").addEventListener("submit", onQuizSubmit);
    const params = new URLSearchParams(location.search);
    if (params.has("verified")) {
      toast(params.get("verified") === "1" ? "Email confirmé" : "Lien de vérification invalide ou expiré.");
      history.replaceState(null, "", location.pathname);
    }
    if (params.has("paid")) {
      toast(params.get("paid") === "1" ? "Paiement confirmé, merci" : "Paiement annulé.");
      history.replaceState(null, "", location.pathname);
    }
    try { CONFIG = await api("/config"); } catch (_) {}
    try { const r = await api("/me"); S = r; if (S.user && S.user.emailVerified) devVerifyUrl = null; afterAuth(); }
    catch (e) { showAuth(); }
  });

  /* ============================ Auth ============================ */
  function initAuth() {
    $("auth-switch").addEventListener("click", (e) => {
      e.preventDefault();
      authMode = authMode === "register" ? "login" : "register";
      $("auth-title").textContent = authMode === "register" ? "Créer un compte" : "Se connecter";
      $("auth-submit").textContent = authMode === "register" ? "S'inscrire" : "Se connecter";
      $("auth-switch").textContent = authMode === "register" ? "Se connecter" : "Créer un compte";
      $("auth-switch").previousSibling.textContent = authMode === "register" ? "Déjà membre ? " : "Nouveau ici ? ";
      $("consent-block").hidden = authMode !== "register";
    });
    $("privacy-link").addEventListener("click", (e) => { e.preventDefault(); openPrivacyModal(); });
    $("auth-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const err = $("auth-error"); err.hidden = true;
      const body = { email: $("a-email").value.trim(), password: $("a-pw").value };
      if (authMode === "register") {
        if (!$("a-age").checked) { err.textContent = "Vous devez confirmer avoir 18 ans ou plus."; err.hidden = false; return; }
        if (!$("a-privacy").checked) { err.textContent = "Vous devez accepter la politique de confidentialité."; err.hidden = false; return; }
        body.ageConfirmed = true; body.acceptPrivacy = true;
      }
      try {
        const r = await api("/" + authMode, { method: "POST", body });
        S = { user: r.user, profile: r.profile, credits: r.credits };
        if (r.verifyUrl) devVerifyUrl = r.verifyUrl;
        afterAuth();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    });
    $("nav-logout").addEventListener("click", async () => {
      try { await api("/logout", { method: "POST" }); } catch (_) {}
      S = { user: null, profile: null, credits: {} }; devVerifyUrl = null;
      $("verify-banner").hidden = true;
      showAuth();
    });
    $("verify-resend").addEventListener("click", async () => {
      try {
        const r = await api("/resend-verification", { method: "POST" });
        if (r.alreadyVerified) { S.user.emailVerified = true; refreshVerify(); toast("Email déjà vérifié"); return; }
        if (r.verifyUrl) { devVerifyUrl = r.verifyUrl; refreshVerify(); toast("Lien de vérification prêt (démo)."); }
        else toast("Email de vérification renvoyé");
      } catch (e) { toast(e.message); }
    });
  }
  function refreshVerify() {
    const banner = $("verify-banner");
    if (S.user && S.user.emailVerified === false) {
      banner.hidden = false;
      $("verify-text").innerHTML = devVerifyUrl
        ? `Confirmez votre email : <a href="${devVerifyUrl}">ouvrir le lien</a> <span class="demo">(démo — en production, ce lien est envoyé par email)</span>`
        : "Confirmez votre adresse email pour sécuriser votre compte.";
    } else banner.hidden = true;
  }
  function showAuth() { $("tabs").hidden = true; showView("auth"); }
  function afterAuth() {
    $("tabs").hidden = false;
    refreshCredits();
    refreshVerify();
    prefill();
    showView(S.profile ? "discover" : "profile");
  }

  /* ====================== Contrôles du profil ====================== */
  function initControls() {
    const csel = $("p-city");
    csel.appendChild(new Option("— non précisé —", ""));
    [...Data.CITIES].sort((a, b) => a[0].localeCompare(b[0], "fr")).forEach((c) => csel.appendChild(new Option(c[0], c[0])));
    $("btn-bdsm-test").textContent = `Passer le test kink (${Data.BDSM_QUESTIONS.length} questions)`;
    $("p-bdsm-optin").addEventListener("change", (e) => { $("bdsm-area").hidden = !e.target.checked; if (!e.target.checked) { tempBdsm = null; refreshBdsmBadge(); } });
    $("btn-mbti-test").addEventListener("click", openMbtiQuiz);
    $("btn-bdsm-test").addEventListener("click", openBdsmQuiz);
    $("profile-form").addEventListener("submit", onSave);
    $("nav-discover").addEventListener("click", () => showView("discover"));
    $("nav-matches").addEventListener("click", () => showView("matches"));
    $("nav-profile").addEventListener("click", () => showView("profile"));
    $("nav-premium").addEventListener("click", () => openPremiumModal());
    $("quiz-close").addEventListener("click", closeOverlay);
    ["pass", "like", "super", "msg"].forEach((k) => $("act-" + k).addEventListener("click", () => act(k)));
  }
  function refreshMbtiBadge() {
    const b = $("mbti-badge"), btn = $("btn-mbti-test");
    if (tempMbti) { b.hidden = false; b.textContent = `Votre type : ${tempMbti}`; if (btn) btn.textContent = "Refaire le test"; }
    else { b.hidden = true; if (btn) btn.textContent = "Passer le test de personnalité"; }
  }
  function refreshBdsmBadge() {
    const b = $("bdsm-badge");
    if (tempBdsm) { b.hidden = false; b.textContent = "Retenu — " + Object.entries(tempBdsm).filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([k]) => BDSM_LABELS[k] || k).join(" · "); } else b.hidden = true;
  }

  /* ============================ Tests ============================ */
  let quizMode = null;
  function openMbtiQuiz() {
    quizMode = "mbti"; $("quiz-title").textContent = "Test de personnalité (MBTI)";
    $("quiz-intro").textContent = "Choisissez l'énoncé qui vous ressemble le plus. 12 questions.";
    const body = $("quiz-body"); body.innerHTML = "";
    Data.MBTI_QUESTIONS.forEach((q, i) => {
      const d = document.createElement("div"); d.className = "quiz-q";
      d.innerHTML = `<p class="quiz-num">${i + 1}.</p><label class="opt"><input type="radio" name="q${i}" value="a"> ${esc(q.ta)}</label><label class="opt"><input type="radio" name="q${i}" value="b"> ${esc(q.tb)}</label>`;
      body.appendChild(d);
    });
    openOverlay();
  }
  function openBdsmQuiz() {
    quizMode = "bdsm"; $("quiz-title").textContent = "Test de compatibilité kink (18+)";
    $("quiz-intro").textContent = `Notez chaque énoncé de 1 (pas du tout) à 10 (tout à fait). ${Data.BDSM_QUESTIONS.length} questions. Aucune bonne réponse — ça reste privé.`;
    const body = $("quiz-body"); body.innerHTML = "";
    Data.BDSM_QUESTIONS.forEach((q, i) => {
      const scale = Array.from({ length: 10 }, (_, k) => k + 1).map((v) =>
        `<label class="lk"><input type="radio" name="q${i}" value="${v}"><span>${v}</span></label>`).join("");
      const d = document.createElement("div"); d.className = "quiz-q";
      d.innerHTML = `<p class="quiz-stmt">${i + 1}. ${esc(q.t)}</p><div class="likert-wrap"><div class="likert-ends"><span>Pas du tout</span><span>Tout à fait</span></div><div class="likert">${scale}</div></div>`;
      body.appendChild(d);
    });
    openOverlay();
  }
  function onQuizSubmit(e) {
    e.preventDefault();
    const n = quizMode === "mbti" ? Data.MBTI_QUESTIONS.length : Data.BDSM_QUESTIONS.length;
    const answers = [];
    for (let i = 0; i < n; i++) {
      const sel = document.querySelector(`input[name="q${i}"]:checked`);
      if (!sel) { const er = $("quiz-error"); er.textContent = `Merci de répondre à la question ${i + 1}.`; er.hidden = false; return; }
      answers.push(quizMode === "mbti" ? sel.value : +sel.value);
    }
    if (quizMode === "mbti") { tempMbti = Data.scoreMbti(answers); refreshMbtiBadge(); }
    else { tempBdsm = Data.scoreBdsm(answers); refreshBdsmBadge(); }
    closeOverlay();
  }
  function openOverlay() { $("quiz-error").hidden = true; $("overlay").hidden = false; document.body.style.overflow = "hidden"; }
  function closeOverlay() { $("overlay").hidden = true; document.body.style.overflow = ""; }

  /* ========================= Enregistrement ======================== */
  async function onSave(e) {
    e.preventDefault();
    const err = $("form-error"); err.hidden = true;
    const fail = (m) => { err.textContent = m; err.hidden = false; };
    const name = $("p-name").value.trim(), dob = $("p-dob").value;
    if (!name) return fail("Indiquez votre prénom.");
    if (!dob) return fail("Indiquez votre date de naissance.");
    const d = new Date(dob + "T00:00:00");
    if (d > new Date()) return fail("La date de naissance ne peut pas être dans le futur.");
    if (!tempMbti) return fail("Passez le test de personnalité (MBTI) pour continuer.");
    const body = {
      name, gender: $("p-gender").value, seeking: $("p-seeking").value, bio: $("p-bio").value.trim(),
      year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
      time: $("p-time").value || null, city: $("p-city").value || null, mbti: tempMbti, bdsm: tempBdsm,
      sensitiveConsent: tempBdsm ? $("p-bdsm-optin").checked : false,
      discoverPhoto: $("p-discover-photo").checked,
    };
    if (pendingPhoto) body.photo = pendingPhoto;
    if (pendingAvatarFeat) body.avatarFeat = pendingAvatarFeat;
    try { const r = await api("/profile", { method: "PUT", body }); S.profile = r.profile; toast("Profil enregistré"); showView("discover"); }
    catch (ex) { fail(ex.message); }
  }

  /* ============================= Vues ============================= */
  function showView(v) {
    if (v !== "matches") { stopChatPoll(); currentChat = null; }
    ["auth", "profile", "discover", "matches"].forEach((k) => { const el = $("view-" + k); if (el) el.hidden = k !== v; });
    $("nav-discover").classList.toggle("active", v === "discover");
    $("nav-matches").classList.toggle("active", v === "matches");
    $("nav-profile").classList.toggle("active", v === "profile");
    if (v === "discover") buildDeck();
    if (v === "matches") { $("chat").hidden = true; renderMatchesList(); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ============================ Filtres =========================== */
  function initFilters() {
    const sync = () => {
      filters.ageMin = +$("f-age-min").value; filters.ageMax = +$("f-age-max").value;
      if (filters.ageMin > filters.ageMax) { $("f-age-max").value = filters.ageMin; filters.ageMax = filters.ageMin; }
      filters.dist = +$("f-dist").value;
      $("age-min-val").textContent = filters.ageMin; $("age-max-val").textContent = filters.ageMax;
      $("dist-val").textContent = filters.dist >= 2050 ? "∞" : filters.dist + " km";
      const narrow = (filters.ageMax - filters.ageMin) < 8 || filters.dist < 300;
      const fn = $("filter-nudge");
      if (narrow) { fn.hidden = false; fn.textContent = Data.NUDGES[5].text; } else fn.hidden = true;
      buildDeck();
    };
    ["f-age-min", "f-age-max", "f-dist"].forEach((id) => $(id).addEventListener("input", sync));
  }

  /* ============================ Deck ============================== */
  async function buildDeck() {
    const params = new URLSearchParams({ ageMin: filters.ageMin, ageMax: filters.ageMax });
    if (filters.dist < 2050) params.set("dist", filters.dist);
    let r;
    try { r = await api("/discover?" + params.toString()); }
    catch (e) { if (e.status === 400) { showView("profile"); return; } toast(e.message); return; }
    candidates = r.candidates;
    const items = []; let n = 0;
    candidates.forEach((c, i) => { items.push({ type: "profile", c }); if ((i + 1) % 3 === 0 && n < Data.NUDGES.length) items.push({ type: "nudge", nudge: Data.NUDGES[n++] }); });
    deck = items; pos = 0;
    $("discover-sub").textContent = candidates.length ? `${candidates.length} profil${candidates.length > 1 ? "s" : ""} à découvrir, classé${candidates.length > 1 ? "s" : ""} par affinité.` : "Aucun profil pour ces filtres — élargissez âge ou distance.";
    renderCurrent();
  }
  function renderCurrent() {
    const el = $("deck"), actions = $("deck-actions");
    if (pos >= deck.length) {
      actions.hidden = true;
      el.innerHTML = `<div class="empty card"><p class="big">Fin de la sélection</p><h3>Vous avez tout vu pour l'instant.</h3><p>Élargissez vos filtres — vos meilleurs matchs sont souvent juste au-delà du cadre.</p></div>`;
      return;
    }
    const item = deck[pos];
    if (item.type === "nudge") { actions.hidden = true; el.innerHTML = renderNudge(item.nudge); el.querySelector(".nudge-next").addEventListener("click", () => { pos++; renderCurrent(); }); return; }
    actions.hidden = false; el.innerHTML = renderProfile(item.c);
    const rep = el.querySelector(".report-link");
    if (rep) rep.addEventListener("click", () => reportModal(+rep.dataset.report, rep.dataset.name));
  }
  function renderNudge(n) {
    return `<article class="nudge card"><p class="nudge-ic">Un mot sur les critères</p><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p><button type="button" class="btn btn-ghost small nudge-next">Continuer à découvrir</button></article>`;
  }
  const HEART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.3l-1.4-1.3C5.4 14.2 2.5 11.6 2.5 8.3 2.5 5.8 4.5 3.9 7 3.9c1.5 0 2.9.7 3.8 1.8.9-1.1 2.3-1.8 3.8-1.8 2.5 0 4.5 1.9 4.5 4.4 0 3.3-2.9 5.9-8.1 10.7L12 20.3z"/></svg>';
  // Première intention : on ne dévoile que le score, la ville et l'âge.
  // Personnalité, signes et affinités se découvrent peu à peu, plus tard.
  function renderProfile(c) {
    const loc = [c.city ? esc(c.city) : null, c.distanceKm != null ? c.distanceKm + " km" : null].filter(Boolean).join(" · ");
    return `<article class="swipe card">
      ${c.superLikedYou ? `<div class="superbadge">${esc(c.name)} vous a super-liké·e</div>` : ""}
      <div class="profile-hero">
        <div class="face">${c.photo ? `<img src="${c.photo}" alt="Photo de ${esc(c.name)}">` : c.avatarSvg}</div>
        <h3 class="hero-name">${esc(c.name)} <span class="age">${c.age}</span></h3>
        <span class="score-pill">${HEART_ICON}<b>${c.score}%</b> d'affinité</span>
        ${loc ? `<p class="hero-verdict">${loc}</p>` : ""}
      </div>
      ${c.bio ? `<section class="pcard"><p class="bio">${esc(c.bio)}</p></section>` : ""}
      <p class="locked">Personnalité, signes et affinités se dévoilent au fil de vos échanges.</p>
      <button type="button" class="report-link" data-report="${c.id}" data-name="${esc(c.name)}">Signaler ce profil</button>
    </article>`;
  }

  /* ========================= Actions swipe ======================== */
  const current = () => { const it = deck[pos]; return it && it.type === "profile" ? it.c : null; };
  function advance() { pos++; renderCurrent(); }
  async function act(kind) {
    const c = current(); if (!c) return;
    if (kind === "msg") return directMessage(c);
    try {
      const r = await api("/swipe", { method: "POST", body: { targetId: c.id, kind } });
      if (kind === "super" && !S.credits.premium) { S.credits.superLikes = Math.max(0, S.credits.superLikes - 1); refreshCredits(); }
      if (kind !== "pass") { if (r.match) matchModal(c, r.matchId, kind === "super"); else toast(`Votre intérêt est envoyé à ${esc(c.name)}.`); }
      advance();
    } catch (e) {
      if (e.status === 402) openPremiumModal(e.data.needPremium);
      else toast(e.message);
    }
  }
  function directMessage(c) {
    composeModal(c.name, async (text) => {
      try { await api("/message-direct", { method: "POST", body: { targetId: c.id, body: text } }); closeModal(); toast(`Message envoyé à ${esc(c.name)}`); }
      catch (e) { if (e.status === 402) { closeModal(); openPremiumModal(e.data.needPremium); } else throw e; }
    });
  }

  /* ============================ Modals =========================== */
  function openModal(html) { $("modal-card").innerHTML = html; $("modal").hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal() { $("modal").hidden = true; $("modal-card").innerHTML = ""; document.body.style.overflow = ""; }
  function matchModal(c, matchId, priority) {
    openModal(`<div class="match-modal"><button type="button" class="close" data-close>✕</button>
      <p class="mm-title">Vous matchez</p><div class="mm-faces"><div class="face big">${c.photo ? `<img src="${c.photo}" alt="">` : c.avatarSvg}</div></div>
      <h3>${esc(c.name)}, ${c.age} — ${c.score}% d'affinité</h3>
      ${priority ? `<p class="mm-prio">Super Like envoyé — vous êtes désormais <b>prioritaire</b> dans la liste de ${esc(c.name)}.</p>` : ""}
      <p class="mm-photo">Ses photos et la conversation sont maintenant débloquées.</p>
      <div class="mm-actions"><button type="button" class="btn" data-chat>Écrire à ${esc(c.name)}</button><button type="button" class="btn btn-ghost" data-close>Continuer</button></div></div>`);
    $("modal-card").querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
    $("modal-card").querySelector("[data-chat]").addEventListener("click", () => { closeModal(); showView("matches"); openChat(matchId); });
  }
  function composeModal(name, onSend) {
    openModal(`<div class="compose"><button type="button" class="close" data-close>✕</button><h3>Message à ${esc(name)}</h3>
      <textarea id="c-text" rows="4" maxlength="400" placeholder="Dites bonjour avec sincérité…"></textarea>
      <p class="error" id="c-err" hidden></p><button type="button" class="btn" data-send>Envoyer</button></div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelector("[data-send]").addEventListener("click", async () => {
      const t = $("c-text").value.trim(); if (!t) { const e = $("c-err"); e.textContent = "Écrivez quelques mots."; e.hidden = false; return; }
      try { await onSend(t); } catch (e) { const el = $("c-err"); el.textContent = e.message; el.hidden = false; }
    });
  }
  function openPremiumModal(context) {
    const note = { super: "Vous n'avez plus de Super Like.", message: "Le message direct (sans match) est une option premium." }[context];
    openModal(`<div class="premium"><button type="button" class="close" data-close>✕</button><p class="pr-title">Âme Sœur Premium</p>
      ${note ? `<p class="pr-note">${esc(note)}</p>` : ""}
      <div class="plans">
        <div class="plan"><h4>Message direct</h4><p class="price">2,99 €</p><p class="pd">Écrivez sans attendre le match.</p><button type="button" class="btn small" data-buy="message">Choisir</button></div>
        <div class="plan"><h4>5 Super Likes</h4><p class="price">4,99 €</p><p class="pd">Passez prioritaire dans leur liste.</p><button type="button" class="btn small" data-buy="super">Choisir</button></div>
        <div class="plan featured"><h4>Premium mensuel</h4><p class="price">12,99 €<small>/mois</small></p><p class="pd">Messages illimités, priorité, likes illimités.</p><button type="button" class="btn small" data-buy="premium">Choisir</button></div>
      </div><p class="demo">Démo — aucun paiement réel n'est effectué.</p></div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => buy(b.dataset.buy)));
  }
  async function buy(plan) {
    try {
      const r = await api("/purchase", { method: "POST", body: { plan } });
      if (r.checkoutUrl) { window.location.href = r.checkoutUrl; return; } // paiement Stripe réel
      S.credits = r.credits; refreshCredits(); closeModal();
      toast(plan === "premium" ? "Premium activé (démo)" : "Achat effectué (démo)");
    } catch (e) { toast(e.message); }
  }
  function reportModal(id, name) {
    openModal(`<div class="report"><button type="button" class="close" data-close>✕</button>
      <h3>Signaler ${esc(name)}</h3>
      <p class="pr-note">Aidez-nous à garder Âme Sœur sûr. Que se passe-t-il ?</p>
      <select id="rep-reason" class="wide">
        <option value="Profil faux / usurpation">Profil faux / usurpation</option>
        <option value="Contenu inapproprié">Contenu ou photo inapproprié</option>
        <option value="Harcèlement / propos déplacés">Harcèlement / propos déplacés</option>
        <option value="Mineur présumé">Mineur présumé</option>
        <option value="Autre">Autre</option>
      </select>
      <button type="button" class="btn" data-send>Envoyer le signalement</button></div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelector("[data-send]").addEventListener("click", async () => {
      try { await api("/report", { method: "POST", body: { targetId: id, reason: $("rep-reason").value } }); closeModal(); toast("Signalement envoyé. Merci."); advance(); }
      catch (e) { toast(e.message); }
    });
  }
  function refreshCredits() { $("credits-count").textContent = S.credits.premium ? "∞" : (S.credits.superLikes || 0); }

  /* ============================ Photo ============================ */
  function initPhoto() {
    $("p-photo").addEventListener("change", (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (!/^image\//.test(file.type)) { toast("Fichier image uniquement."); return; }
      if (file.size > 12 * 1024 * 1024) { toast("Image trop lourde (12 Mo max)."); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 512, scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
          const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
          const ctx = cv.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          pendingPhoto = cv.toDataURL("image/jpeg", 0.82);
          const pv = $("p-photo-preview"); pv.src = pendingPhoto; pv.hidden = false;
          // Extraction locale (teint, cheveux) → avatar ressemblant. La photo ne quitte pas l'appareil pour cela.
          try { pendingAvatarFeat = extractFeatures(ctx.getImageData(0, 0, w, h).data, w, h); }
          catch (_) { pendingAvatarFeat = null; }
          refreshAvatarPreview(pendingAvatarFeat);
        };
        img.onerror = () => toast("Image illisible.");
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* =============== Avatar généré depuis la photo (local) =============== */
  // Palettes « sur-style » Micah : on aligne teint/cheveux extraits sur ces teintes.
  const SKIN_PALETTE = ["ffdbb4", "f1c9a5", "e8b98c", "dda877", "cf9b6f", "bd8a5e", "a3714a", "8a5a34", "6b4423", "4a2f1d"];
  const HAIR_PALETTE = ["0e0e0e", "2b2320", "3a2a1e", "5a3d29", "6b4a2f", "8a5a2b", "a97c50", "c9a35b", "d8b878", "5c2c1a", "8c3b1a", "9a9a9a", "d9d3c6", "efe9df"];
  const hx = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  const rgbToHex = (c) => hx(c[0]) + hx(c[1]) + hx(c[2]);
  const hexToRgb = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  function snap(c, palette) { let best = palette[0], bd = Infinity; for (const p of palette) { const d = dist2(c, hexToRgb(p)); if (d < bd) { bd = d; best = p; } } return best; }
  function regionAvg(data, w, h, fx, fy, fw, fh, filter) {
    const x0 = Math.max(0, Math.floor(fx * w)), y0 = Math.max(0, Math.floor(fy * h));
    const x1 = Math.min(w, Math.floor((fx + fw) * w)), y1 = Math.min(h, Math.floor((fy + fh) * h));
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 200) continue;
      const R = data[i], G = data[i + 1], B = data[i + 2];
      if (filter && !filter(R, G, B)) continue;
      r += R; g += G; b += B; n++;
    }
    return n ? [r / n, g / n, b / n, n] : null;
  }
  function skinish(R, G, B) {
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
    if (mx < 45 || mx > 252) return false;   // trop sombre / cramé
    if (R < G || G < B) return false;         // teint : R ≥ G ≥ B
    if (mx - mn < 12) return false;           // trop gris (fond, mur)
    return true;
  }
  function extractFeatures(data, w, h) {
    let skin = regionAvg(data, w, h, 0.30, 0.42, 0.40, 0.34, skinish);
    if (!skin || skin[3] < 40) skin = regionAvg(data, w, h, 0.34, 0.45, 0.32, 0.28, null);
    const feat = {};
    if (skin) feat.skinColor = snap([skin[0], skin[1], skin[2]], SKIN_PALETTE);
    const top = regionAvg(data, w, h, 0.28, 0.02, 0.44, 0.16, null);
    if (top) {
      const c = [top[0], top[1], top[2]], mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
      const sat = (mx - mn) / (mx || 1), background = mx > 232 && sat < 0.08;
      const nearSkin = skin && dist2(c, [skin[0], skin[1], skin[2]]) < 500;
      if (!background && !nearSkin) feat.hairColor = snap(c, HAIR_PALETTE);
    }
    return (feat.skinColor || feat.hairColor) ? feat : null;
  }
  async function refreshAvatarPreview(feat) {
    const box = $("p-avatar-preview"); if (!box) return;
    try { const r = await api("/avatar/preview", { method: "POST", body: { avatarFeat: feat || null } }); box.innerHTML = r.svg; box.hidden = false; }
    catch (_) { box.hidden = true; }
  }

  /* ============================ RGPD ============================= */
  function initRgpd() {
    $("btn-privacy").addEventListener("click", openPrivacyModal);
    $("footer-privacy").addEventListener("click", (e) => { e.preventDefault(); openPrivacyModal(); });
    $("cookie-privacy").addEventListener("click", (e) => { e.preventDefault(); openPrivacyModal(); });
    $("btn-export").addEventListener("click", exportData);
    $("btn-delete").addEventListener("click", deleteAccount);
    // Bandeau cookies (cookie strictement nécessaire) — informatif.
    const ok = $("cookie-ok"), banner = $("cookie-banner");
    if (!localStorage.getItem("cookieNotice")) banner.hidden = false;
    ok.addEventListener("click", () => { localStorage.setItem("cookieNotice", "1"); banner.hidden = true; });
  }
  async function exportData() {
    try {
      const res = await fetch("/api/gdpr/export", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Export impossible.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "mes-donnees-amesoeur.json"; a.click();
      URL.revokeObjectURL(url); toast("Vos données ont été exportées");
    } catch (e) { toast(e.message); }
  }
  async function deleteAccount() {
    if (!confirm("Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.")) return;
    if (!confirm("Dernière confirmation : cette suppression est définitive et immédiate.")) return;
    try { await api("/account", { method: "DELETE" }); S = { user: null, profile: null, credits: {} }; toast("Compte supprimé. Au revoir."); showAuth(); }
    catch (e) { toast(e.message); }
  }
  function openPrivacyModal() {
    openModal(`<div class="privacy-doc"><button type="button" class="close" data-close>✕</button>
      <h3>Politique de confidentialité</h3>
      <p class="pv-date">Version du 11 juillet 2026</p>
      <p>Âme Sœur traite vos données personnelles dans le respect du RGPD. Voici l'essentiel, en clair.</p>
      <h4>1. Responsable de traitement</h4>
      <p>${esc(CONFIG.org.name)}${CONFIG.org.legal ? " — " + esc(CONFIG.org.legal) : ""}. Contact / délégué à la protection des données : <b>${esc(CONFIG.org.dpoEmail)}</b>.</p>
      <h4>2. Données collectées</h4>
      <p>Email, mot de passe (haché, jamais lisible), prénom, genre, préférence de recherche, bio, avatar, éventuelle photo, date/heure/lieu de naissance, type MBTI, et — <b>uniquement si vous y consentez</b> — vos préférences intimes (kink), qui constituent des <b>données sensibles</b> (Art. 9 RGPD).</p>
      <h4>3. Finalités & base légale</h4>
      <p>Vos données servent à créer votre profil, calculer des compatibilités et vous proposer des rencontres. La base légale est votre <b>consentement</b> (Art. 6.1.a), et pour les données sensibles un <b>consentement explicite</b> distinct (Art. 9.2.a) recueilli avant le test kink.</p>
      <h4>4. Destinataires</h4>
      <p>Vos données ne sont ni vendues ni cédées. Les autres membres ne voient que les informations de votre profil (jamais votre email ni vos réponses brutes aux tests). Vos photos ne sont révélées qu'après un match mutuel.</p>
      <h4>5. Durée de conservation</h4>
      <p>Vos données sont conservées tant que votre compte est actif. Vous pouvez le supprimer à tout moment : l'effacement est alors immédiat et total.</p>
      <h4>6. Vos droits</h4>
      <p>Vous disposez des droits d'<b>accès</b>, de <b>rectification</b> (modifiez votre profil), d'<b>effacement</b> (supprimez votre compte), de <b>portabilité</b> (exportez vos données en JSON), d'<b>opposition</b> et de <b>retrait du consentement</b> à tout moment. Vous pouvez introduire une réclamation auprès de la <b>CNIL</b> (cnil.fr).</p>
      <h4>7. Cookies</h4>
      <p>Un seul cookie est utilisé, strictement nécessaire à votre connexion (session). Aucun traceur publicitaire, aucune mesure d'audience tierce.</p>
      <h4>8. Sécurité</h4>
      <p>Les mots de passe sont hachés (scrypt) et les échanges se font via votre session authentifiée.</p>
      <button type="button" class="btn" data-close>Fermer</button></div>`);
    $("modal-card").querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  }

  /* =========================== Messages ========================== */
  function initMatches() {
    $("chat-back").addEventListener("click", () => { stopChatPoll(); currentChat = null; lastMsgCount = -1; $("chat").hidden = true; $("matches-list").hidden = false; renderMatchesList(); });
    $("chat-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = $("chat-input"), body = input.value.trim(); if (!body || !currentChat) return;
      input.value = "";
      try { await api("/messages/" + currentChat, { method: "POST", body: { body } }); await loadChat(currentChat); }
      catch (ex) { toast(ex.message); }
    });
  }
  async function renderMatchesList() {
    const list = $("matches-list"); list.hidden = false;
    let r; try { r = await api("/matches"); } catch (e) { toast(e.message); return; }
    if (!r.matches.length) { list.innerHTML = `<div class="empty card"><p class="big">Aucune conversation</p><h3>Pas encore de match.</h3><p>Filez découvrir des profils et likez ceux qui vous parlent !</p></div>`; return; }
    list.innerHTML = "";
    r.matches.forEach((m) => {
      const av = m.other.photo ? `<img src="${m.other.photo}" alt="">` : m.avatarSvg;
      const d = document.createElement("button"); d.type = "button"; d.className = "match-row";
      d.innerHTML = `<div class="mr-face">${av}</div><div class="mr-info"><h4>${esc(m.other.name)}, ${m.other.age}${m.superd ? ' <span class="mr-super">Super Like</span>' : ""}</h4><p>${m.lastMessage ? (m.lastMessage.mine ? "Vous : " : "") + esc(m.lastMessage.body) : "<i>Dites bonjour…</i>"}</p></div>`;
      d.addEventListener("click", () => openChat(m.matchId));
      list.appendChild(d);
    });
  }
  let chatPoll = null;
  function stopChatPoll() { if (chatPoll) { clearInterval(chatPoll); chatPoll = null; } }
  function openChat(id) {
    currentChat = id; $("matches-list").hidden = true; $("chat").hidden = false; loadChat(id);
    stopChatPoll(); chatPoll = setInterval(() => { if (currentChat === id && !$("chat").hidden) loadChat(id, true); else stopChatPoll(); }, 4000);
  }
  let lastMsgCount = -1;
  async function loadChat(id, isPoll) {
    let r; try { r = await api("/messages/" + id); } catch (e) { if (!isPoll) toast(e.message); return; }
    if (isPoll && r.messages.length === lastMsgCount) return; // rien de neuf → pas de re-render
    lastMsgCount = r.messages.length;
    const o = r.match.other;
    // Révélation progressive : la photo se dé-floute au fil de la conversation.
    const REVEAL_AT = 6, count = r.messages.length;
    if (o.photo) {
      const blur = Math.max(0, (1 - count / REVEAL_AT) * 8);
      $("chat-face").innerHTML = `<img src="${o.photo}" alt="" style="filter:blur(${blur.toFixed(1)}px)">`;
      $("chat-meta").textContent = blur > 0.2
        ? `${o.city || "—"} · photo nette dans ${Math.max(0, REVEAL_AT - count)} message(s)`
        : `${o.city || "—"}`;
    } else {
      $("chat-face").innerHTML = r.match.avatarSvg;
      $("chat-meta").textContent = `${o.city || "—"} · photo pas encore partagée`;
    }
    $("chat-name").textContent = `${o.name}, ${o.age}`;
    renderReveal(r.reveal);
    const body = $("chat-body");
    body.innerHTML = r.messages.length ? r.messages.map((m) => `<div class="bubble ${m.mine ? "me" : "them"}">${esc(m.body)}</div>`).join("")
      : `<p class="chat-empty">Vous avez matché ! Lancez la conversation avec ${esc(o.name)}.</p>`;
    body.scrollTop = body.scrollHeight;
  }
  // Bandeau d'affinités qui se dévoile message après message.
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  function renderReveal(rv) {
    const box = $("chat-reveal"); if (!box) return;
    if (!rv) { box.hidden = true; return; }
    const chips = [];
    if (rv.mbti) chips.push(`<span class="rv-chip">🧠 ${esc(rv.mbti)}</span>`);
    if (rv.signs) {
      if (rv.signs.sun) chips.push(`<span class="rv-chip">☀️ ${esc(rv.signs.sun)}</span>`);
      if (rv.signs.chinese) chips.push(`<span class="rv-chip">🐉 ${esc(rv.signs.chinese)}</span>`);
      if (rv.signs.ascendant) chips.push(`<span class="rv-chip">↗️ Asc. ${esc(rv.signs.ascendant)}</span>`);
    }
    const factors = rv.factors ? `<div class="rv-factors">${rv.factors.map((f) =>
      `<div class="rv-frow"><span>${f.emoji} ${esc(f.label)}</span><b>${f.value}%</b><i style="width:${f.value}%"></i></div>`).join("")}</div>` : "";
    const next = rv.next
      ? `<p class="rv-next">🔒 ${esc(cap(rv.next.label))} — dans ${rv.next.in} message${rv.next.in > 1 ? "s" : ""}</p>`
      : `<p class="rv-next">Toutes vos affinités sont dévoilées.</p>`;
    box.innerHTML = `<div class="rv-score"><span class="score-pill">${HEART_ICON}<b>${rv.score}%</b> d'affinité</span><span class="rv-verdict">${esc(rv.verdict)}</span></div>${chips.length ? `<div class="rv-chips">${chips.join("")}</div>` : ""}${factors}${next}`;
    box.hidden = false;
  }

  /* =========================== Prefill =========================== */
  function prefill() {
    const me = S.profile; if (!me) return;
    $("p-name").value = me.name || ""; $("p-gender").value = me.gender || "F";
    $("p-seeking").value = me.seeking || "T"; $("p-bio").value = me.bio || "";
    if (me.year) $("p-dob").value = `${me.year}-${String(me.month).padStart(2, "0")}-${String(me.day).padStart(2, "0")}`;
    $("p-time").value = me.time || ""; $("p-city").value = me.city || "";
    tempMbti = MBTI_TYPES.includes(me.mbti) ? me.mbti : null; refreshMbtiBadge();
    tempBdsm = me.bdsm || null;
    if (me.bdsm) { $("p-bdsm-optin").checked = true; $("bdsm-area").hidden = false; refreshBdsmBadge(); }
    if (me.photo) { const pv = $("p-photo-preview"); pv.src = me.photo; pv.hidden = false; }
    $("p-discover-photo").checked = !!me.discoverPhoto;
    pendingAvatarFeat = me.avatarFeat || null;
    refreshAvatarPreview(pendingAvatarFeat);
  }

  /* ============================= Toast ========================== */
  let toastT = null;
  // Place le toast juste sous l'en-tête réellement visible (barre + éventuel
  // bandeau de vérification), pour qu'il ne chevauche jamais le contenu.
  function positionToast(t) {
    // Hauteurs de mise en page (indépendantes du défilement) : la barre et le
    // bandeau sont empilés en haut, et chaque changement de vue défile en haut.
    const bar = $("topbar"), banner = $("verify-banner");
    let top = bar ? bar.offsetHeight : 56;
    if (banner && banner.offsetParent !== null) top += banner.offsetHeight;
    t.style.top = Math.round(top + 12) + "px";
  }
  function toast(msg) {
    let t = $("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; positionToast(t); t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  document.addEventListener("click", (e) => { if (e.target && e.target.id === "modal") closeModal(); });

  // PWA : installation sur mobile + coquille hors-ligne.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
  }
})();
