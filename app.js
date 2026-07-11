"use strict";
/* Application de rencontres — état, vues, tests, matching. */
(function () {
  const $ = (id) => document.getElementById(id);
  const MBTI_TYPES = ["INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
    "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP"];
  const STORE = "amesoeur.me";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const BDSM_LABELS = {
    dominant: "Dominant·e", submissive: "Soumis·e", sadist: "Sadique", masochist: "Masochiste",
    rigger: "Attacheur·se", ropebunny: "Attaché·e", brattamer: "Dresseur·se", brat: "Insolent·e",
    owner: "Maître/Maîtresse", pet: "Animal de compagnie", daddy: "Figure protectrice", little: "Tendre",
    voyeur: "Voyeur·se", exhibitionist: "Exhibitionniste", experimental: "Explorateur·rice", switch: "Switch",
    degrader: "Humiliant·e", degradee: "Humilié·e", primalhunter: "Primal (chasseur)", primalprey: "Primal (proie)",
  };

  let me = null;         // profil sauvegardé
  let tempMbti = null;   // résultat de test en attente d'enregistrement
  let tempBdsm = null;

  /* ------------------------- Initialisation ------------------------- */
  function initControls() {
    // Avatars
    const ap = $("avatar-picker");
    Data.AVATARS.forEach((a, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "avatar-opt"; b.textContent = a; b.dataset.avatar = a;
      if (i === 0) b.classList.add("selected");
      b.addEventListener("click", () => {
        ap.querySelectorAll(".avatar-opt").forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        me && (me._photo = null);
      });
      ap.appendChild(b);
    });
    // Villes
    const csel = $("p-city");
    csel.appendChild(new Option("— non précisé —", ""));
    [...Data.CITIES].sort((a, b) => a[0].localeCompare(b[0], "fr"))
      .forEach((c) => csel.appendChild(new Option(c[0], c[0])));
    // MBTI
    const msel = $("p-mbti");
    msel.appendChild(new Option("— choisir ou passer le test —", ""));
    MBTI_TYPES.forEach((t) => msel.appendChild(new Option(t, t)));
    msel.addEventListener("change", () => { tempMbti = msel.value || null; refreshMbtiBadge(); });

    // BDSM opt-in
    $("p-bdsm-optin").addEventListener("change", (e) => {
      $("bdsm-area").hidden = !e.target.checked;
      if (!e.target.checked) { tempBdsm = null; refreshBdsmBadge(); }
    });
    $("btn-mbti-test").addEventListener("click", openMbtiQuiz);
    $("btn-bdsm-test").addEventListener("click", openBdsmQuiz);

    $("profile-form").addEventListener("submit", onSave);
    $("nav-discover").addEventListener("click", () => showView("discover"));
    $("nav-profile").addEventListener("click", () => showView("profile"));
    $("quiz-close").addEventListener("click", closeOverlay);
  }

  function refreshMbtiBadge() {
    const b = $("mbti-badge");
    if (tempMbti) { b.hidden = false; b.textContent = `✅ Type retenu : ${tempMbti}`; }
    else b.hidden = true;
  }
  function refreshBdsmBadge() {
    const b = $("bdsm-badge");
    if (tempBdsm) {
      const top = Object.entries(tempBdsm).filter(([, v]) => v > 0).sort((a, b2) => b2[1] - a[1])
        .slice(0, 3).map(([k]) => BDSM_LABELS[k] || k).join(" · ");
      b.hidden = false; b.textContent = `✅ Profil enregistré — ${top}`;
    } else b.hidden = true;
  }

  /* ------------------------------ Tests ------------------------------ */
  let quizMode = null;
  function openMbtiQuiz() {
    quizMode = "mbti";
    $("quiz-title").textContent = "Test de personnalité (MBTI)";
    $("quiz-intro").textContent = "Choisissez l'énoncé qui vous ressemble le plus. 12 questions.";
    const body = $("quiz-body"); body.innerHTML = "";
    Data.MBTI_QUESTIONS.forEach((q, i) => {
      const d = document.createElement("div"); d.className = "quiz-q";
      d.innerHTML =
        `<p class="quiz-num">${i + 1}.</p>` +
        `<label class="opt"><input type="radio" name="q${i}" value="a"> ${esc(q.ta)}</label>` +
        `<label class="opt"><input type="radio" name="q${i}" value="b"> ${esc(q.tb)}</label>`;
      body.appendChild(d);
    });
    openOverlay();
  }
  function openBdsmQuiz() {
    quizMode = "bdsm";
    $("quiz-title").textContent = "Test d'affinités BDSM (18+)";
    $("quiz-intro").textContent = "Notez chaque énoncé de 0 (pas du tout) à 4 (tout à fait). 16 questions. Aucune bonne réponse — soyez honnête, ça reste privé.";
    const body = $("quiz-body"); body.innerHTML = "";
    Data.BDSM_QUESTIONS.forEach((q, i) => {
      const scale = [0, 1, 2, 3, 4].map((v) =>
        `<label class="lk"><input type="radio" name="q${i}" value="${v}"><span>${v}</span></label>`).join("");
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
      if (!sel) { showQuizError(`Merci de répondre à la question ${i + 1}.`); return; }
      answers.push(quizMode === "mbti" ? sel.value : +sel.value);
    }
    if (quizMode === "mbti") {
      tempMbti = Data.scoreMbti(answers);
      $("p-mbti").value = MBTI_TYPES.includes(tempMbti) ? tempMbti : "";
      refreshMbtiBadge();
    } else {
      tempBdsm = Data.scoreBdsm(answers);
      refreshBdsmBadge();
    }
    closeOverlay();
  }
  function showQuizError(m) { const e = $("quiz-error"); e.textContent = m; e.hidden = false; }
  function openOverlay() { $("quiz-error").hidden = true; $("overlay").hidden = false; document.body.style.overflow = "hidden"; }
  function closeOverlay() { $("overlay").hidden = true; document.body.style.overflow = ""; }

  /* --------------------------- Enregistrement ------------------------ */
  function onSave(e) {
    e.preventDefault();
    const err = $("form-error"); err.hidden = true;
    const name = $("p-name").value.trim();
    const dob = $("p-dob").value;
    if (!name) return fail("Indiquez votre prénom.");
    if (!dob) return fail("Indiquez votre date de naissance.");
    const d = new Date(dob + "T00:00:00");
    if (d > new Date()) return fail("La date de naissance ne peut pas être dans le futur.");
    if (!tempMbti) return fail("Choisissez votre type MBTI ou passez le test.");

    const avatar = document.querySelector(".avatar-opt.selected")?.dataset.avatar || "⭐";
    me = {
      name, avatar, photo: me && me._photo ? me._photo : (me ? me.photo : null),
      gender: $("p-gender").value, seeking: $("p-seeking").value, bio: $("p-bio").value.trim(),
      year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
      time: $("p-time").value || null, city: $("p-city").value || null,
      mbti: tempMbti, bdsm: tempBdsm,
    };
    if (me._photo !== undefined) delete me._photo;
    localStorage.setItem(STORE, JSON.stringify(me));
    $("tabs").hidden = false;
    showView("discover");
    function fail(m) { err.textContent = m; err.hidden = false; return false; }
  }

  /* ------------------------------ Vues ------------------------------- */
  function showView(v) {
    $("view-profile").hidden = v !== "profile";
    $("view-discover").hidden = v !== "discover";
    $("nav-discover").classList.toggle("active", v === "discover");
    $("nav-profile").classList.toggle("active", v === "profile");
    if (v === "discover") renderMatches();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toEngine(p) {
    const ci = p.city ? Data.CITY_BY_NAME[p.city] : null;
    return {
      name: p.name, year: p.year, month: p.month, day: p.day, time: p.time || null,
      zone: ci ? ci.zone : null, lat: ci ? ci.lat : null, lon: ci ? ci.lon : null,
      mbti: p.mbti, bdsm: p.bdsm || null,
    };
  }
  function age(p) {
    const t = new Date(), b = new Date(p.year, p.month - 1, p.day);
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }
  function wantsMutual(a, b) {
    const ok = (seeker, target) => seeker.seeking === "T" || seeker.seeking === target.gender;
    return ok(a, b) && ok(b, a);
  }

  function renderMatches() {
    const list = $("match-list");
    const meE = toEngine(me);
    const candidates = Data.SEED.filter((s) => wantsMutual(me, s))
      .map((s) => ({ s, r: Engine.compatibility(meE, toEngine(s)) }))
      .sort((x, y) => y.r.score - x.r.score);

    $("discover-sub").textContent = candidates.length
      ? `${candidates.length} profils classés par affinité avec vous, ${esc(me.name)}.`
      : "Aucun profil ne correspond à vos critères pour l'instant.";

    list.innerHTML = "";
    candidates.forEach(({ s, r }, idx) => list.appendChild(matchCard(s, r, idx)));
  }

  function matchCard(s, r, idx) {
    const el = document.createElement("article");
    el.className = "match";
    const av = s.photo ? `<img src="${s.photo}" alt="">` : `<span>${s.avatar}</span>`;
    const circ = 2 * Math.PI * 26;
    const off = circ * (1 - r.score / 100);
    const bothBdsm = me.bdsm && s.bdsm;
    const bars = r.factors.map((f) => {
      const pct = Math.round(f.value * 100);
      return `<li><span class="fl">${f.emoji} ${esc(f.label)}</span><span class="fv">${pct}%</span>
        <span class="bar"><i style="width:${pct}%"></i></span></li>`;
    }).join("");

    el.innerHTML = `
      <div class="match-head">
        <div class="avatar">${av}</div>
        <div class="who">
          <h3>${esc(s.name)}, ${age(s)} <span class="sign">${r.b.sun.emoji} ${r.b.chinese.emoji}</span></h3>
          <p class="meta">${esc(s.city)} · ${esc(s.mbti)}${r.b.ascendant ? " · asc. " + r.b.ascendant.emoji : ""}</p>
          <p class="bio">${esc(s.bio)}</p>
        </div>
        <div class="score">
          <svg viewBox="0 0 60 60" width="64" height="64">
            <circle cx="30" cy="30" r="26" class="rbg"/>
            <circle cx="30" cy="30" r="26" class="rfg" style="stroke-dasharray:${circ};stroke-dashoffset:${off}"/>
          </svg>
          <b>${r.score}<small>%</small></b>
        </div>
      </div>
      <p class="verdict">${esc(Engine.verdict(r.score))}</p>
      <button type="button" class="btn btn-ghost small toggle">Voir le détail des affinités</button>
      <div class="detail" hidden>
        <ul class="factors">${bars}</ul>
        ${!bothBdsm ? `<p class="tip">🔒 ${me.bdsm ? esc(s.name) + " n'a pas" : "Vous n'avez pas"} rempli le test BDSM — l'alchimie intime n'est pas comptée dans ce score.</p>` : ""}
      </div>`;
    const btn = el.querySelector(".toggle"), det = el.querySelector(".detail");
    btn.addEventListener("click", () => {
      det.hidden = !det.hidden;
      btn.textContent = det.hidden ? "Voir le détail des affinités" : "Masquer le détail";
    });
    return el;
  }

  /* ----------------------------- Prefill ----------------------------- */
  function prefill() {
    if (!me) return;
    $("p-name").value = me.name || "";
    $("p-gender").value = me.gender || "F";
    $("p-seeking").value = me.seeking || "T";
    $("p-bio").value = me.bio || "";
    if (me.year) $("p-dob").value =
      `${me.year}-${String(me.month).padStart(2, "0")}-${String(me.day).padStart(2, "0")}`;
    $("p-time").value = me.time || "";
    $("p-city").value = me.city || "";
    $("p-mbti").value = MBTI_TYPES.includes(me.mbti) ? me.mbti : "";
    tempMbti = me.mbti || null; refreshMbtiBadge();
    tempBdsm = me.bdsm || null;
    if (me.bdsm) { $("p-bdsm-optin").checked = true; $("bdsm-area").hidden = false; refreshBdsmBadge(); }
    const target = document.querySelector(`.avatar-opt[data-avatar="${me.avatar}"]`);
    if (target) { document.querySelectorAll(".avatar-opt").forEach((x) => x.classList.remove("selected")); target.classList.add("selected"); }
  }

  /* ------------------------------ Photo ------------------------------ */
  function initPhoto() {
    $("p-photo").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { if (me) me._photo = reader.result; else me = { _photo: reader.result }; };
      reader.readAsDataURL(file);
    });
  }

  /* ------------------------ Décor cœurs flottants -------------------- */
  function hearts() {
    const layer = document.querySelector(".hearts");
    const glyphs = ["💖", "💗", "💓", "💕", "❤", "🩷"];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.textContent = glyphs[i % glyphs.length];
      const seed = (i * 97 % 100) / 100;
      s.style.left = (seed * 100).toFixed(1) + "%";
      s.style.setProperty("--s", (14 + seed * 20).toFixed(0) + "px");
      s.style.setProperty("--d", (11 + seed * 11).toFixed(1) + "s");
      s.style.setProperty("--delay", (seed * 11).toFixed(1) + "s");
      layer.appendChild(s);
    }
  }

  /* ------------------------------ Boot ------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initControls();
    initPhoto();
    $("quiz-form").addEventListener("submit", onQuizSubmit);
    hearts();
    try { me = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (_) { me = null; }
    if (me) {
      prefill();
      $("tabs").hidden = false;
      showView("discover");
    } else {
      showView("profile");
    }
  });
})();
