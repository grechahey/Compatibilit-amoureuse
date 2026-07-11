"use strict";
/* Application de rencontres — profil, tests, swipe, filtres, premium. */
(function () {
  const $ = (id) => document.getElementById(id);
  const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
  const K_ME = "amesoeur.me", K_CR = "amesoeur.credits", K_SW = "amesoeur.swipes";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hash01 = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };

  const BDSM_LABELS = {
    dominant: "Dominant·e", submissive: "Soumis·e", sadist: "Sadique", masochist: "Masochiste",
    rigger: "Attacheur·se", ropebunny: "Attaché·e", brattamer: "Dresseur·se", brat: "Insolent·e",
    owner: "Maître/sse", pet: "Animal", daddy: "Protecteur·rice", little: "Tendre",
    voyeur: "Voyeur·se", exhibitionist: "Exhib.", experimental: "Explorateur·rice", switch: "Switch",
    degrader: "Humiliant·e", degradee: "Humilié·e", primalhunter: "Primal chasseur", primalprey: "Primal proie",
  };

  let me = null, tempMbti = null, tempBdsm = null;
  let credits = { superLikes: 1, messages: 0, premium: false };
  let swipes = { liked: [], passed: [], matched: [] };
  let deck = [], pos = 0;
  const filters = { ageMin: 18, ageMax: 80, dist: 2050 };

  /* ============================ Boot ============================ */
  document.addEventListener("DOMContentLoaded", () => {
    initControls(); initPhoto(); initFilters();
    $("quiz-form").addEventListener("submit", onQuizSubmit);
    hearts();
    try { me = JSON.parse(localStorage.getItem(K_ME) || "null"); } catch (_) { me = null; }
    try { credits = Object.assign(credits, JSON.parse(localStorage.getItem(K_CR) || "{}")); } catch (_) {}
    try { swipes = Object.assign(swipes, JSON.parse(localStorage.getItem(K_SW) || "{}")); } catch (_) {}
    refreshCredits();
    if (me) { prefill(); $("tabs").hidden = false; showView("discover"); }
    else showView("profile");
  });

  /* ====================== Contrôles du profil ====================== */
  function initControls() {
    const ap = $("avatar-picker");
    Data.AVATARS.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "avatar-opt"; b.textContent = a; b.dataset.avatar = a;
      if (i === 0) b.classList.add("selected");
      b.addEventListener("click", () => {
        ap.querySelectorAll(".avatar-opt").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
      });
      ap.appendChild(b);
    });
    const csel = $("p-city");
    csel.appendChild(new Option("— non précisé —", ""));
    [...Data.CITIES].sort((a, b) => a[0].localeCompare(b[0], "fr")).forEach((c) => csel.appendChild(new Option(c[0], c[0])));
    const msel = $("p-mbti");
    msel.appendChild(new Option("— choisir ou passer le test —", ""));
    MBTI_TYPES.forEach((t) => msel.appendChild(new Option(t, t)));
    msel.addEventListener("change", () => { tempMbti = msel.value || null; refreshMbtiBadge(); });
    $("p-bdsm-optin").addEventListener("change", (e) => {
      $("bdsm-area").hidden = !e.target.checked;
      if (!e.target.checked) { tempBdsm = null; refreshBdsmBadge(); }
    });
    $("btn-mbti-test").addEventListener("click", openMbtiQuiz);
    $("btn-bdsm-test").addEventListener("click", openBdsmQuiz);
    $("profile-form").addEventListener("submit", onSave);
    $("nav-discover").addEventListener("click", () => showView("discover"));
    $("nav-profile").addEventListener("click", () => showView("profile"));
    $("nav-premium").addEventListener("click", () => openPremiumModal());
    $("quiz-close").addEventListener("click", closeOverlay);
    // Actions de swipe
    $("act-pass").addEventListener("click", () => act("pass"));
    $("act-like").addEventListener("click", () => act("like"));
    $("act-super").addEventListener("click", () => act("super"));
    $("act-msg").addEventListener("click", () => act("msg"));
  }
  function refreshMbtiBadge() {
    const b = $("mbti-badge");
    if (tempMbti) { b.hidden = false; b.textContent = `✅ Type retenu : ${tempMbti}`; } else b.hidden = true;
  }
  function refreshBdsmBadge() {
    const b = $("bdsm-badge");
    if (tempBdsm) {
      const top = Object.entries(tempBdsm).filter(([, v]) => v > 0).sort((a, c) => c[1] - a[1])
        .slice(0, 3).map(([k]) => BDSM_LABELS[k] || k).join(" · ");
      b.hidden = false; b.textContent = `✅ Profil enregistré — ${top}`;
    } else b.hidden = true;
  }

  /* ============================ Tests ============================ */
  let quizMode = null;
  function openMbtiQuiz() {
    quizMode = "mbti";
    $("quiz-title").textContent = "Test de personnalité (MBTI)";
    $("quiz-intro").textContent = "Choisissez l'énoncé qui vous ressemble le plus. 12 questions.";
    const body = $("quiz-body"); body.innerHTML = "";
    Data.MBTI_QUESTIONS.forEach((q, i) => {
      const d = document.createElement("div"); d.className = "quiz-q";
      d.innerHTML = `<p class="quiz-num">${i + 1}.</p>
        <label class="opt"><input type="radio" name="q${i}" value="a"> ${esc(q.ta)}</label>
        <label class="opt"><input type="radio" name="q${i}" value="b"> ${esc(q.tb)}</label>`;
      body.appendChild(d);
    });
    openOverlay();
  }
  function openBdsmQuiz() {
    quizMode = "bdsm";
    $("quiz-title").textContent = "Test d'affinités BDSM (18+)";
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
  function onSave(e) {
    e.preventDefault();
    const err = $("form-error"); err.hidden = true;
    const fail = (m) => { err.textContent = m; err.hidden = false; return false; };
    const name = $("p-name").value.trim();
    const dob = $("p-dob").value;
    if (!name) return fail("Indiquez votre prénom.");
    if (!dob) return fail("Indiquez votre date de naissance.");
    const d = new Date(dob + "T00:00:00");
    if (d > new Date()) return fail("La date de naissance ne peut pas être dans le futur.");
    if (!tempMbti) return fail("Choisissez votre type MBTI ou passez le test.");
    const photo = me && me.photo ? me.photo : null;
    me = {
      name, avatar: document.querySelector(".avatar-opt.selected")?.dataset.avatar || "⭐", photo,
      gender: $("p-gender").value, seeking: $("p-seeking").value, bio: $("p-bio").value.trim(),
      year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
      time: $("p-time").value || null, city: $("p-city").value || null, mbti: tempMbti, bdsm: tempBdsm,
    };
    localStorage.setItem(K_ME, JSON.stringify(me));
    $("tabs").hidden = false; showView("discover");
  }

  /* ============================= Vues ============================= */
  function showView(v) {
    $("view-profile").hidden = v !== "profile";
    $("view-discover").hidden = v !== "discover";
    $("nav-discover").classList.toggle("active", v === "discover");
    $("nav-profile").classList.toggle("active", v === "profile");
    if (v === "discover") buildDeck();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const toEngine = (p) => {
    const ci = p.city ? Data.CITY_BY_NAME[p.city] : null;
    return { name: p.name, year: p.year, month: p.month, day: p.day, time: p.time || null,
      zone: ci ? ci.zone : null, lat: ci ? ci.lat : null, lon: ci ? ci.lon : null, mbti: p.mbti, bdsm: p.bdsm || null };
  };
  function age(p) {
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

  /* ============================ Filtres =========================== */
  function initFilters() {
    const sync = () => {
      filters.ageMin = +$("f-age-min").value; filters.ageMax = +$("f-age-max").value;
      if (filters.ageMin > filters.ageMax) { $("f-age-max").value = filters.ageMin; filters.ageMax = filters.ageMin; }
      filters.dist = +$("f-dist").value;
      $("age-min-val").textContent = filters.ageMin;
      $("age-max-val").textContent = filters.ageMax;
      $("dist-val").textContent = filters.dist >= 2050 ? "∞" : filters.dist + " km";
      // Nudge si filtres trop serrés
      const narrow = (filters.ageMax - filters.ageMin) < 8 || filters.dist < 300;
      const fn = $("filter-nudge");
      if (narrow) { fn.hidden = false; fn.textContent = "🧭 " + Data.NUDGES[5].text; } else fn.hidden = true;
      buildDeck();
    };
    ["f-age-min", "f-age-max", "f-dist"].forEach((id) => $(id).addEventListener("input", sync));
  }

  /* ============================ Deck ============================== */
  function buildDeck() {
    if (!me) return;
    const meE = toEngine(me);
    const done = new Set([...swipes.passed, ...swipes.liked, ...swipes.matched]);
    let cands = Data.SEED.filter((s) => !done.has(s.id) && mutual(me, s))
      .filter((s) => { const a = age(s); return a >= filters.ageMin && a <= filters.ageMax; })
      .filter((s) => { if (filters.dist >= 2050) return true; const d = distanceKm(me, s); return d == null || d <= filters.dist; })
      .map((s) => ({ type: "profile", s, r: Engine.compatibility(meE, toEngine(s)) }));
    // Super Like reçu en tête, puis par note décroissante
    cands.sort((x, y) => (!!y.s.superLikedYou - !!x.s.superLikedYou) || (y.r.score - x.r.score));
    // Éparpiller des conseils tous les 3 profils
    const items = []; let n = 0;
    cands.forEach((c, i) => {
      items.push(c);
      if ((i + 1) % 3 === 0 && n < Data.NUDGES.length) items.push({ type: "nudge", nudge: Data.NUDGES[n++] });
    });
    deck = items; pos = 0;
    $("discover-sub").textContent = cands.length
      ? `${cands.length} profil${cands.length > 1 ? "s" : ""} à découvrir, classé${cands.length > 1 ? "s" : ""} par affinité.`
      : "Aucun profil pour ces filtres — élargissez âge ou distance.";
    renderCurrent();
  }

  function renderCurrent() {
    const el = $("deck"), actions = $("deck-actions");
    while (pos < deck.length && deck[pos] === null) pos++;
    if (pos >= deck.length) {
      actions.hidden = true;
      el.innerHTML = `<div class="empty card"><p class="big">💌</p><h3>Vous avez tout vu pour l'instant.</h3>
        <p>Élargissez vos filtres — vos meilleurs matchs sont souvent juste au-delà du cadre.</p></div>`;
      return;
    }
    const item = deck[pos];
    if (item.type === "nudge") { actions.hidden = true; el.innerHTML = renderNudge(item.nudge); el.querySelector(".nudge-next").addEventListener("click", () => { pos++; renderCurrent(); }); return; }
    actions.hidden = false;
    el.innerHTML = renderProfile(item.s, item.r);
    const tog = el.querySelector(".chips-toggle");
    if (tog) tog.addEventListener("click", () => { const d = el.querySelector(".factors"); d.hidden = !d.hidden; tog.textContent = d.hidden ? "Voir le détail des affinités" : "Masquer"; });
  }

  function renderNudge(n) {
    return `<article class="nudge card">
      <p class="nudge-ic">${n.icon}</p>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.text)}</p>
      <button type="button" class="btn btn-ghost small nudge-next">Continuer à découvrir</button>
    </article>`;
  }

  function renderProfile(s, r) {
    const d = distanceKm(me, s);
    const bothBdsm = me.bdsm && s.bdsm;
    const circ = 2 * Math.PI * 30, off = circ * (1 - r.score / 100);
    const chips = r.factors.map((f) => `<li><span class="fl">${f.emoji} ${esc(f.label)}</span><span class="fv">${Math.round(f.value * 100)}%</span><span class="bar"><i style="width:${Math.round(f.value * 100)}%"></i></span></li>`).join("");
    return `<article class="swipe card">
      ${s.superLikedYou ? `<div class="superbadge">💛 ${esc(s.name)} vous a super-liké·e</div>` : ""}
      <div class="face">${Avatar.face(s.id, s.look)}</div>
      <div class="score big"><svg viewBox="0 0 72 72" width="86" height="86">
        <circle cx="36" cy="36" r="30" class="rbg"/><circle cx="36" cy="36" r="30" class="rfg" style="stroke-dasharray:${circ};stroke-dashoffset:${off}"/>
      </svg><b>${r.score}<small>%</small></b></div>
      <h3>${esc(s.name)}, ${age(s)} <span class="sign">${r.b.sun.emoji} ${r.b.chinese.emoji}${r.b.ascendant ? " ⬆" + r.b.ascendant.emoji : ""}</span></h3>
      <p class="meta">${esc(s.mbti)} · ${esc(s.city)}${d != null ? " · " + d + " km" : ""}</p>
      <p class="bio">${esc(s.bio)}</p>
      <p class="verdict">${esc(Engine.verdict(r.score))}</p>
      <p class="locked">🔒 Photos débloquées après un match mutuel.</p>
      <button type="button" class="btn btn-ghost small chips-toggle">Voir le détail des affinités</button>
      <ul class="factors" hidden>${chips}${!bothBdsm ? `<li class="tip">🔒 Test BDSM non partagé — l'alchimie intime n'est pas comptée.</li>` : ""}</ul>
    </article>`;
  }

  /* ========================= Actions swipe ======================== */
  function currentSeed() { const it = deck[pos]; return it && it.type === "profile" ? it : null; }
  function advance() { pos++; renderCurrent(); }
  function saveSwipes() { localStorage.setItem(K_SW, JSON.stringify(swipes)); }

  function act(kind) {
    const it = currentSeed(); if (!it) return;
    const s = it.s, r = it.r;
    if (kind === "pass") { swipes.passed.push(s.id); saveSwipes(); advance(); return; }
    if (kind === "msg") { directMessage(s); return; }
    if (kind === "super") {
      if (credits.superLikes <= 0) { openPremiumModal("super"); return; }
      credits.superLikes--; saveCredits(); refreshCredits();
      swipes.liked.push(s.id); swipes.matched.push(s.id); saveSwipes();
      matchModal(s, r, true); advance(); return;
    }
    // like
    swipes.liked.push(s.id);
    const back = s.superLikedYou || hash01(s.id + "|" + me.name) < r.score / 100;
    if (back) { swipes.matched.push(s.id); matchModal(s, r, false); }
    else toast(`Votre ♥ est parti vers ${esc(s.name)}.`);
    saveSwipes(); advance();
  }

  function directMessage(s) {
    if (!credits.premium && credits.messages <= 0) { openPremiumModal("message"); return; }
    composeModal(s, () => { if (!credits.premium) { credits.messages--; saveCredits(); refreshCredits(); } });
  }

  /* ============================ Modals =========================== */
  function openModal(html) { $("modal-card").innerHTML = html; $("modal").hidden = false; document.body.style.overflow = "hidden"; }
  function closeModal() { $("modal").hidden = true; $("modal-card").innerHTML = ""; document.body.style.overflow = ""; }

  function matchModal(s, r, priority) {
    openModal(`<div class="match-modal">
      <button type="button" class="close" data-close>✕</button>
      <p class="mm-title">✨ Match !</p>
      <div class="mm-faces"><div class="face big">${Avatar.face(s.id, s.look)}</div></div>
      <h3>${esc(s.name)}, ${age(s)} — ${r.score}% d'affinité</h3>
      ${priority ? `<p class="mm-prio">💛 Super Like envoyé — vous êtes désormais <b>prioritaire</b> dans la liste de ${esc(s.name)}.</p>` : ""}
      <p class="mm-photo">📸 Ses photos se dévoilent maintenant que c'est réciproque.<br><span class="demo">(Démo : sur la vraie appli, les photos de ${esc(s.name)} apparaîtraient ici.)</span></p>
      <div class="mm-actions">
        <button type="button" class="btn" data-msg>Écrire à ${esc(s.name)}</button>
        <button type="button" class="btn btn-ghost" data-close>Continuer</button>
      </div></div>`);
    $("modal-card").querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
    $("modal-card").querySelector("[data-msg]").addEventListener("click", () => composeModal(s));
  }

  function composeModal(s, onSend) {
    openModal(`<div class="compose">
      <button type="button" class="close" data-close>✕</button>
      <h3>Message à ${esc(s.name)}</h3>
      <textarea id="c-text" rows="4" maxlength="400" placeholder="Dites bonjour avec sincérité…"></textarea>
      <p class="error" id="c-err" hidden></p>
      <button type="button" class="btn" data-send>Envoyer 💌</button>
    </div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelector("[data-send]").addEventListener("click", () => {
      const t = $("c-text").value.trim();
      if (!t) { const e = $("c-err"); e.textContent = "Écrivez quelques mots."; e.hidden = false; return; }
      if (onSend) onSend();
      closeModal(); toast(`Message envoyé à ${esc(s.name)} 💌 (démo)`);
    });
  }

  function openPremiumModal(context) {
    const note = { super: "Vous n'avez plus de Super Like.", message: "Le message direct (sans match) est une option premium." }[context];
    openModal(`<div class="premium">
      <button type="button" class="close" data-close>✕</button>
      <p class="pr-title">👑 Âme Sœur Premium</p>
      ${note ? `<p class="pr-note">${esc(note)}</p>` : ""}
      <div class="plans">
        <div class="plan"><h4>Message direct</h4><p class="price">2,99 €</p><p class="pd">Écrivez à quelqu'un sans attendre le match.</p><button type="button" class="btn small" data-buy="message">Choisir</button></div>
        <div class="plan"><h4>5 Super Likes 💛</h4><p class="price">4,99 €</p><p class="pd">Passez prioritaire dans leur liste.</p><button type="button" class="btn small" data-buy="super">Choisir</button></div>
        <div class="plan featured"><h4>Premium mensuel 👑</h4><p class="price">12,99 €<small>/mois</small></p><p class="pd">Messages illimités, priorité, likes illimités.</p><button type="button" class="btn small" data-buy="premium">Choisir</button></div>
      </div>
      <p class="demo">Démo — aucun paiement réel n'est effectué.</p>
    </div>`);
    $("modal-card").querySelector("[data-close]").addEventListener("click", closeModal);
    $("modal-card").querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => buy(b.dataset.buy)));
  }
  function buy(type) {
    if (type === "message") { credits.messages += 1; toast("Crédit message ajouté (démo)."); }
    else if (type === "super") { credits.superLikes += 5; toast("5 Super Likes ajoutés (démo)."); }
    else if (type === "premium") { credits.premium = true; toast("Premium activé 👑 (démo)."); }
    saveCredits(); refreshCredits(); closeModal();
  }
  function saveCredits() { localStorage.setItem(K_CR, JSON.stringify(credits)); }
  function refreshCredits() { $("credits-count").textContent = credits.premium ? "👑" : credits.superLikes; }

  /* ============================ Toast ============================ */
  let toastT = null;
  function toast(msg) {
    let t = $("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* =========================== Prefill =========================== */
  function prefill() {
    if (!me) return;
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
  function initPhoto() {
    $("p-photo").addEventListener("change", (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { (me = me || {}).photo = reader.result; };
      reader.readAsDataURL(file);
    });
  }

  /* ======================= Décor cœurs ========================== */
  function hearts() {
    const layer = document.querySelector(".hearts");
    const g = ["💖", "💗", "💓", "💕", "❤", "🩷"];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.textContent = g[i % g.length];
      const seed = (i * 97 % 100) / 100;
      s.style.left = (seed * 100).toFixed(1) + "%";
      s.style.setProperty("--s", (14 + seed * 20).toFixed(0) + "px");
      s.style.setProperty("--d", (11 + seed * 11).toFixed(1) + "s");
      s.style.setProperty("--delay", (seed * 11).toFixed(1) + "s");
      layer.appendChild(s);
    }
  }

  // Fermer le modal générique en cliquant le fond
  document.addEventListener("click", (e) => { if (e.target && e.target.id === "modal") closeModal(); });
})();
