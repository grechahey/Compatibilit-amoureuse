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
    rigger: "Attacheur·se", ropebunny: "Attaché·e", brattamer: "Dresseur·se", brat: "Insolent·e",
    owner: "Maître/sse", pet: "Animal", daddy: "Protecteur·rice", little: "Tendre",
    voyeur: "Voyeur·se", exhibitionist: "Exhib.", experimental: "Explorateur·rice", switch: "Switch",
    degrader: "Humiliant·e", degradee: "Humilié·e", primalhunter: "Primal chasseur", primalprey: "Primal proie",
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
  let tempMbti = null, tempBdsm = null;
  let candidates = [], deck = [], pos = 0;
  let authMode = "register";
  let currentChat = null;
  const filters = { ageMin: 18, ageMax: 80, dist: 2050 };

  /* ============================ Boot ============================ */
  document.addEventListener("DOMContentLoaded", async () => {
    initControls(); initFilters(); initAuth(); initMatches(); initRgpd();
    $("quiz-form").addEventListener("submit", onQuizSubmit);
    hearts();
    try { const r = await api("/me"); S = r; afterAuth(); }
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
        afterAuth();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; }
    });
    $("nav-logout").addEventListener("click", async () => {
      try { await api("/logout", { method: "POST" }); } catch (_) {}
      S = { user: null, profile: null, credits: {} };
      showAuth();
    });
  }
  function showAuth() { $("tabs").hidden = true; showView("auth"); }
  function afterAuth() {
    $("tabs").hidden = false;
    refreshCredits();
    prefill();
    showView(S.profile ? "discover" : "profile");
  }

  /* ====================== Contrôles du profil ====================== */
  function initControls() {
    const ap = $("avatar-picker");
    Data.AVATARS.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "avatar-opt"; b.textContent = a; b.dataset.avatar = a;
      if (i === 0) b.classList.add("selected");
      b.addEventListener("click", () => { ap.querySelectorAll(".avatar-opt").forEach((x) => x.classList.remove("selected")); b.classList.add("selected"); });
      ap.appendChild(b);
    });
    const csel = $("p-city");
    csel.appendChild(new Option("— non précisé —", ""));
    [...Data.CITIES].sort((a, b) => a[0].localeCompare(b[0], "fr")).forEach((c) => csel.appendChild(new Option(c[0], c[0])));
    const msel = $("p-mbti");
    msel.appendChild(new Option("— choisir ou passer le test —", ""));
    MBTI_TYPES.forEach((t) => msel.appendChild(new Option(t, t)));
    msel.addEventListener("change", () => { tempMbti = msel.value || null; refreshMbtiBadge(); });
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
  function refreshMbtiBadge() { const b = $("mbti-badge"); if (tempMbti) { b.hidden = false; b.textContent = `✅ Type retenu : ${tempMbti}`; } else b.hidden = true; }
  function refreshBdsmBadge() {
    const b = $("bdsm-badge");
    if (tempBdsm) { b.hidden = false; b.textContent = "✅ Profil enregistré — " + Object.entries(tempBdsm).filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([k]) => BDSM_LABELS[k] || k).join(" · "); } else b.hidden = true;
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
    $("quiz-intro").textContent = "Notez de 0 (pas du tout) à 4 (tout à fait). 16 questions. Aucune bonne réponse — ça reste privé.";
    const body = $("quiz-body"); body.innerHTML = "";
    Data.BDSM_QUESTIONS.forEach((q, i) => {
      const scale = [0, 1, 2, 3, 4].map((v) => `<label class="lk"><input type="radio" name="q${i}" value="${v}"><span>${v}</span></label>`).join("");
      const d = document.createElement("div"); d.className = "quiz-q";
      d.innerHTML = `<p class="quiz-stmt">${i + 1}. ${esc(q.t)}</p><div class="likert">${scale}</div>`;
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
    if (quizMode === "mbti") { tempMbti = Data.scoreMbti(answers); $("p-mbti").value = MBTI_TYPES.includes(tempMbti) ? tempMbti : ""; refreshMbtiBadge(); }
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
    if (!tempMbti) return fail("Choisissez votre type MBTI ou passez le test.");
    const body = {
      name, avatar: document.querySelector(".avatar-opt.selected")?.dataset.avatar || "⭐",
      gender: $("p-gender").value, seeking: $("p-seeking").value, bio: $("p-bio").value.trim(),
      year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
      time: $("p-time").value || null, city: $("p-city").value || null, mbti: tempMbti, bdsm: tempBdsm,
      sensitiveConsent: tempBdsm ? $("p-bdsm-optin").checked : false,
    };
    try { const r = await api("/profile", { method: "PUT", body }); S.profile = r.profile; toast("Profil enregistré ✅"); showView("discover"); }
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
      if (narrow) { fn.hidden = false; fn.textContent = "🧭 " + Data.NUDGES[5].text; } else fn.hidden = true;
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
      el.innerHTML = `<div class="empty card"><p class="big">💌</p><h3>Vous avez tout vu pour l'instant.</h3><p>Élargissez vos filtres — vos meilleurs matchs sont souvent juste au-delà du cadre.</p></div>`;
      return;
    }
    const item = deck[pos];
    if (item.type === "nudge") { actions.hidden = true; el.innerHTML = renderNudge(item.nudge); el.querySelector(".nudge-next").addEventListener("click", () => { pos++; renderCurrent(); }); return; }
    actions.hidden = false; el.innerHTML = renderProfile(item.c);
    const tog = el.querySelector(".chips-toggle");
    if (tog) tog.addEventListener("click", () => { const d = el.querySelector(".factors"); d.hidden = !d.hidden; tog.textContent = d.hidden ? "Voir le détail des affinités" : "Masquer"; });
  }
  function renderNudge(n) {
    return `<article class="nudge card"><p class="nudge-ic">${n.icon}</p><h3>${esc(n.title)}</h3><p>${esc(n.text)}</p><button type="button" class="btn btn-ghost small nudge-next">Continuer à découvrir</button></article>`;
  }
  function renderProfile(c) {
    const circ = 2 * Math.PI * 30, off = circ * (1 - c.score / 100);
    const chips = c.factors.map((f) => `<li><span class="fl">${f.emoji} ${esc(f.label)}</span><span class="fv">${Math.round(f.value * 100)}%</span><span class="bar"><i style="width:${Math.round(f.value * 100)}%"></i></span></li>`).join("");
    return `<article class="swipe card">
      ${c.superLikedYou ? `<div class="superbadge">💛 ${esc(c.name)} vous a super-liké·e</div>` : ""}
      <div class="face">${Avatar.face(c.avatarSeed)}</div>
      <div class="score big"><svg viewBox="0 0 72 72" width="86" height="86"><circle cx="36" cy="36" r="30" class="rbg"/><circle cx="36" cy="36" r="30" class="rfg" style="stroke-dasharray:${circ};stroke-dashoffset:${off}"/></svg><b>${c.score}<small>%</small></b></div>
      <h3>${esc(c.name)}, ${c.age} <span class="sign">${c.sun} ${c.chinese}${c.ascendant ? " ⬆" + c.ascendant : ""}</span></h3>
      <p class="meta">${esc(c.mbti)} · ${esc(c.city || "—")}${c.distanceKm != null ? " · " + c.distanceKm + " km" : ""}</p>
      <p class="bio">${esc(c.bio)}</p>
      <p class="verdict">${esc(c.verdict)}</p>
      <p class="locked">🔒 Photos débloquées après un match mutuel.</p>
      <button type="button" class="btn btn-ghost small chips-toggle">Voir le détail des affinités</button>
      <ul class="factors" hidden>${chips}${!c.bothBdsm ? `<li class="tip">🔒 Test kink non partagé — l'alchimie intime n'est pas comptée.</li>` : ""}</ul>
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
      if (kind !== "pass") { if (r.match) matchModal(c, r.matchId, kind === "super"); else toast(`Votre ♥ est parti vers ${esc(c.name)}.`); }
      advance();
    } catch (e) {
      if (e.status === 402) openPremiumModal(e.data.needPremium);
      else toast(e.message);
    }
  }
  function directMessage(c) {
    composeModal(c.name, async (text) => {
      try { await api("/message-direct", { method: "POST", body: { targetId: c.id, body: text } }); closeModal(); toast(`Message envoyé à ${esc(c.name)} 💌`); }
      catch (e) { if (e.status === 402) { closeModal(); openPremiumModal(e.data.needPremium); } else throw e; }
    });
  }

  /* ============================ Modals =========================== */
  function openModal(html) { $("modal-card").innerHTML = html; $("modal").hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal() { $("modal").hidden = true; $("modal-card").innerHTML = ""; document.body.style.overflow = ""; }
  function matchModal(c, matchId, priority) {
    openModal(`<div class="match-modal"><button type="button" class="close" data-close>✕</button>
      <p class="mm-title">✨ Match !</p><div class="mm-faces"><div class="face big">${Avatar.face(c.avatarSeed)}</div></div>
      <h3>${esc(c.name)}, ${c.age} — ${c.score}% d'affinité</h3>
      ${priority ? `<p class="mm-prio">💛 Super Like envoyé — vous êtes désormais <b>prioritaire</b> dans la liste de ${esc(c.name)}.</p>` : ""}
      <p class="mm-photo">📸 Ses photos et la conversation sont maintenant débloquées.</p>
      <div class="mm-actions"><button type="button" class="btn" data-chat>Écrire à ${esc(c.name)}</button><button type="button" class="btn btn-ghost" data-close>Continuer</button></div></div>`);
    $("modal-card").querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
    $("modal-card").querySelector("[data-chat]").addEventListener("click", () => { closeModal(); showView("matches"); openChat(matchId); });
  }
  function composeModal(name, onSend) {
    openModal(`<div class="compose"><button type="button" class="close" data-close>✕</button><h3>Message à ${esc(name)}</h3>
      <textarea id="c-text" rows="4" maxlength="400" placeholder="Dites bonjour avec sincérité…"></textarea>
      <p class="error" id="c-err" hidden></p><button type="button" class="btn" data-send>Envoyer 💌</button></div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelector("[data-send]").addEventListener("click", async () => {
      const t = $("c-text").value.trim(); if (!t) { const e = $("c-err"); e.textContent = "Écrivez quelques mots."; e.hidden = false; return; }
      try { await onSend(t); } catch (e) { const el = $("c-err"); el.textContent = e.message; el.hidden = false; }
    });
  }
  function openPremiumModal(context) {
    const note = { super: "Vous n'avez plus de Super Like.", message: "Le message direct (sans match) est une option premium." }[context];
    openModal(`<div class="premium"><button type="button" class="close" data-close>✕</button><p class="pr-title">👑 Âme Sœur Premium</p>
      ${note ? `<p class="pr-note">${esc(note)}</p>` : ""}
      <div class="plans">
        <div class="plan"><h4>Message direct</h4><p class="price">2,99 €</p><p class="pd">Écrivez sans attendre le match.</p><button type="button" class="btn small" data-buy="message">Choisir</button></div>
        <div class="plan"><h4>5 Super Likes 💛</h4><p class="price">4,99 €</p><p class="pd">Passez prioritaire dans leur liste.</p><button type="button" class="btn small" data-buy="super">Choisir</button></div>
        <div class="plan featured"><h4>Premium mensuel 👑</h4><p class="price">12,99 €<small>/mois</small></p><p class="pd">Messages illimités, priorité, likes illimités.</p><button type="button" class="btn small" data-buy="premium">Choisir</button></div>
      </div><p class="demo">Démo — aucun paiement réel n'est effectué.</p></div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => buy(b.dataset.buy)));
  }
  async function buy(plan) {
    try { const r = await api("/purchase", { method: "POST", body: { plan } }); S.credits = r.credits; refreshCredits(); closeModal(); toast(plan === "premium" ? "Premium activé 👑 (démo)" : "Achat effectué (démo)"); }
    catch (e) { toast(e.message); }
  }
  function refreshCredits() { $("credits-count").textContent = S.credits.premium ? "👑" : (S.credits.superLikes || 0); }

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
      URL.revokeObjectURL(url); toast("Vos données ont été exportées 📦");
    } catch (e) { toast(e.message); }
  }
  async function deleteAccount() {
    if (!confirm("Supprimer définitivement votre compte et toutes vos données ? Cette action est irréversible.")) return;
    if (!confirm("Dernière confirmation : cette suppression est définitive et immédiate.")) return;
    try { await api("/account", { method: "DELETE" }); S = { user: null, profile: null, credits: {} }; toast("Compte supprimé. Au revoir 👋"); showAuth(); }
    catch (e) { toast(e.message); }
  }
  function openPrivacyModal() {
    openModal(`<div class="privacy-doc"><button type="button" class="close" data-close>✕</button>
      <h3>Politique de confidentialité</h3>
      <p class="pv-date">Version du 11 juillet 2026</p>
      <p>Âme Sœur traite vos données personnelles dans le respect du RGPD. Voici l'essentiel, en clair.</p>
      <h4>1. Responsable de traitement</h4>
      <p>Âme Sœur (prototype de démonstration). Contact / délégué à la protection des données : <b>dpo@amesoeur.exemple</b>.</p>
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
    if (!r.matches.length) { list.innerHTML = `<div class="empty card"><p class="big">🫶</p><h3>Pas encore de match.</h3><p>Filez découvrir des profils et likez ceux qui vous parlent !</p></div>`; return; }
    list.innerHTML = "";
    r.matches.forEach((m) => {
      const av = m.other.photo ? `<img src="${m.other.photo}" alt="">` : Avatar.face(m.avatarSeed);
      const d = document.createElement("button"); d.type = "button"; d.className = "match-row";
      d.innerHTML = `<div class="mr-face">${av}</div><div class="mr-info"><h4>${esc(m.other.name)}, ${m.other.age} ${m.superd ? "💛" : ""}</h4><p>${m.lastMessage ? (m.lastMessage.mine ? "Vous : " : "") + esc(m.lastMessage.body) : "<i>Dites bonjour…</i>"}</p></div>`;
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
    $("chat-face").innerHTML = o.photo ? `<img src="${o.photo}" alt="">` : Avatar.face(r.match.avatarSeed);
    $("chat-name").textContent = `${o.name}, ${o.age}`;
    $("chat-meta").textContent = `${o.mbti} · ${o.city || "—"}${o.photo ? "" : " · 📷 pas encore de photo"}`;
    const body = $("chat-body");
    body.innerHTML = r.messages.length ? r.messages.map((m) => `<div class="bubble ${m.mine ? "me" : "them"}">${esc(m.body)}</div>`).join("")
      : `<p class="chat-empty">Vous avez matché ! Lancez la conversation avec ${esc(o.name)}.</p>`;
    body.scrollTop = body.scrollHeight;
  }

  /* =========================== Prefill =========================== */
  function prefill() {
    const me = S.profile; if (!me) return;
    $("p-name").value = me.name || ""; $("p-gender").value = me.gender || "F";
    $("p-seeking").value = me.seeking || "T"; $("p-bio").value = me.bio || "";
    if (me.year) $("p-dob").value = `${me.year}-${String(me.month).padStart(2, "0")}-${String(me.day).padStart(2, "0")}`;
    $("p-time").value = me.time || ""; $("p-city").value = me.city || "";
    $("p-mbti").value = MBTI_TYPES.includes(me.mbti) ? me.mbti : "";
    tempMbti = me.mbti || null; refreshMbtiBadge();
    tempBdsm = me.bdsm || null;
    if (me.bdsm) { $("p-bdsm-optin").checked = true; $("bdsm-area").hidden = false; refreshBdsmBadge(); }
    const target = document.querySelector(`.avatar-opt[data-avatar="${me.avatar}"]`);
    if (target) { document.querySelectorAll(".avatar-opt").forEach((x) => x.classList.remove("selected")); target.classList.add("selected"); }
  }

  /* ======================= Décor & toast ======================== */
  function hearts() {
    const layer = document.querySelector(".hearts"); const g = ["💖", "💗", "💓", "💕", "❤", "🩷"];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span"); s.textContent = g[i % g.length];
      const seed = (i * 97 % 100) / 100;
      s.style.left = (seed * 100).toFixed(1) + "%"; s.style.setProperty("--s", (14 + seed * 20).toFixed(0) + "px");
      s.style.setProperty("--d", (11 + seed * 11).toFixed(1) + "s"); s.style.setProperty("--delay", (seed * 11).toFixed(1) + "s");
      layer.appendChild(s);
    }
  }
  let toastT = null;
  function toast(msg) {
    let t = $("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }
  document.addEventListener("click", (e) => { if (e.target && e.target.id === "modal") closeModal(); });
})();
