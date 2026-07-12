"use strict";
/* Back office — tableau de bord admin. Toutes les données passent par
 * /api/admin/* protégé par adminAuth (email dans ADMIN_EMAILS). */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const GENDER = { F: "Femmes", H: "Hommes", NB: "Non-binaires" };
  const SEEKING = { T: "Tout le monde", F: "Des femmes", H: "Des hommes" };
  const WKEYS = [
    { key: "mbti", label: "Personnalité (MBTI)" }, { key: "astro", label: "Astrologie" },
    { key: "chinese", label: "Astrologie chinoise" }, { key: "numero", label: "Numérologie" },
    { key: "bdsm", label: "Alchimie kink" },
  ];
  const DEFAULT_W = { mbti: 0.30, astro: 0.25, chinese: 0.15, numero: 0.10, bdsm: 0.20 };

  async function api(path, opts = {}) {
    const res = await fetch("/api" + path, {
      method: opts.method || "GET", credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Erreur"), { status: res.status });
    return data;
  }
  const fmtDate = (ms) => { try { return new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" }); } catch (_) { return "—"; } };
  const fmtDateTime = (ms) => { try { return new Date(ms).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (_) { return "—"; } };

  async function exportCsv() {
    const btn = $("export-csv"); const label = btn.textContent; btn.textContent = "Export…";
    try {
      const res = await fetch("/api/admin/export.csv", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Export refusé (" + res.status + ")");
      const blob = await res.blob(), url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "membres-amesoeur.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
    finally { btn.textContent = label; renderLog(); }
  }
  async function renderReports() {
    let r; try { r = await api("/admin/reports"); } catch (_) { return; }
    const body = $("reports-body");
    if (!r.reports.length) { body.innerHTML = `<tr><td colspan="7" class="muted">Aucun signalement.</td></tr>`; return; }
    body.innerHTML = r.reports.map((x) => `<tr${x.flagged && !x.banned ? ' class="flagged"' : ""}>
      <td>${esc(x.name || "—")} <span class="muted">#${x.target}</span></td>
      <td><b>${x.reporters}</b></td>
      <td>${x.count}</td>
      <td class="muted">${esc(x.reasons.join(", "))}</td>
      <td class="muted">${fmtDate(x.last)}</td>
      <td>${x.banned ? '<span class="pill-ban">Banni</span>' : x.flagged ? '<span class="pill-flag">Auto-masqué</span>' : '<span class="muted">actif</span>'}</td>
      <td><button type="button" class="btn btn-ghost small ban-btn" data-id="${x.target}" data-ban="${x.banned ? 0 : 1}">${x.banned ? "Réactiver" : "Bannir"}</button></td>
    </tr>`).join("");
    body.querySelectorAll(".ban-btn").forEach((b) => b.addEventListener("click", async () => {
      const id = +b.dataset.id, ban = b.dataset.ban === "1";
      if (ban && !confirm("Bannir ce membre ? Il sera déconnecté et masqué.")) return;
      try { await api("/admin/ban", { method: "POST", body: { userId: id, banned: ban } }); renderReports(); renderMembers(); renderLog(); }
      catch (e) { alert(e.message); }
    }));
  }
  async function renderLog() {
    let r; try { r = await api("/admin/log"); } catch (_) { return; }
    $("log-body").innerHTML = r.log.length ? r.log.map((e) => `<tr>
      <td class="muted">${fmtDateTime(e.at)}</td>
      <td>${esc(e.email || "—")}</td>
      <td>${esc(e.action)}</td>
      <td class="muted">${esc(e.ip || "—")}</td></tr>`).join("")
      : `<tr><td colspan="4" class="muted">Aucun accès enregistré.</td></tr>`;
  }

  function barChart(el, items, opts = {}) {
    const total = opts.total != null ? opts.total : items.reduce((s, i) => s + i.value, 0);
    const max = Math.max(1, ...items.map((i) => i.value));
    el.innerHTML = items.length ? items.map((i) => {
      const pct = Math.round((i.value / max) * 100);
      const share = total ? Math.round((i.value / total) * 100) : 0;
      return `<div class="bar-row"><span class="bl">${esc(i.label)}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="bv">${i.value}${opts.pct ? ` · ${share}%` : ""}</span></div>`;
    }).join("") : `<p class="hint">Aucune donnée.</p>`;
  }

  function renderKpis(d) {
    const k = [
      { b: d.users, s: "Inscrits", hot: true }, { b: d.withProfile, s: "Profils complets" },
      { b: d.verified, s: "Emails vérifiés" }, { b: d.premium, s: "Premium" },
      { b: d.matches, s: "Matchs" }, { b: d.messages, s: "Messages" },
      { b: d.kinkOptin, s: "Ont rempli le kink" },
    ];
    $("kpis").innerHTML = k.map((x) => `<div class="kpi${x.hot ? " hot" : ""}"><b>${x.b}</b><span>${x.s}</span></div>`).join("");
  }

  function renderCharts(d) {
    barChart($("ch-gender"), d.byGender.map((g) => ({ label: GENDER[g.k] || g.k || "—", value: g.c })), { pct: true });
    barChart($("ch-seeking"), d.bySeeking.map((g) => ({ label: SEEKING[g.k] || g.k || "—", value: g.c })), { pct: true });
    barChart($("ch-city"), d.byCity.map((g) => ({ label: g.k, value: g.c })));
    barChart($("ch-mbti"), d.byMbti.map((g) => ({ label: g.k, value: g.c })));
    const order = ["18-24", "25-34", "35-44", "45-54", "55+"];
    barChart($("ch-age"), order.map((k) => ({ label: k + " ans", value: d.ageBuckets[k] || 0 })), { pct: true });
    // Inscriptions : timeline 30 jours
    const map = {}; d.signups.forEach((s) => { map[s.k] = s.c; });
    const days = [], now = new Date();
    for (let i = 29; i >= 0; i--) { const dt = new Date(now); dt.setDate(now.getDate() - i); days.push(map[dt.toISOString().slice(0, 10)] || 0); }
    const max = Math.max(1, ...days);
    $("ch-signups").innerHTML = days.map((c) => `<div class="sb${c ? "" : " empty"}" style="height:${Math.round((c / max) * 100)}%" title="${c}"></div>`).join("");
  }

  async function renderMembers() {
    const r = await api("/admin/users?limit=300");
    $("members-count").textContent = r.total;
    $("members-body").innerHTML = r.users.map((u) => `<tr>
      <td>${esc(u.name || "—")}</td>
      <td>${u.age != null ? u.age : "—"}</td>
      <td class="muted">${esc(GENDER[u.gender] || "—")}</td>
      <td class="muted">${esc(SEEKING[u.seeking] || "—")}</td>
      <td class="muted">${esc(u.city || "—")}</td>
      <td>${esc(u.mbti || "—")}</td>
      <td>${u.hasKink ? '<span class="pill-yes">oui</span>' : '<span class="pill-no">—</span>'}</td>
      <td>${u.premium ? '<span class="pill-yes">Premium</span>' : '<span class="pill-no">—</span>'}</td>
      <td>${u.verified ? '<span class="pill-yes">✓</span>' : '<span class="pill-no">—</span>'}</td>
      <td class="muted">${fmtDate(u.createdAt)}</td>
      <td class="muted">${esc(u.email)}</td></tr>`).join("");
  }

  async function initAudit() {
    const r = await api("/admin/members");
    const opts = `<option value="">— choisir —</option>` + r.members.map((m) => `<option value="${m.id}">${esc(m.name)}${m.age != null ? " (" + m.age + ")" : ""}</option>`).join("");
    $("mA").innerHTML = opts; $("mB").innerHTML = opts;
    $("audit-run").addEventListener("click", runAudit);
  }
  async function runAudit() {
    const a = $("mA").value, b = $("mB").value, out = $("audit-result");
    if (!a || !b) { out.innerHTML = `<p class="hint">Sélectionnez deux membres.</p>`; return; }
    if (a === b) { out.innerHTML = `<p class="hint">Choisissez deux membres différents.</p>`; return; }
    out.innerHTML = `<p class="hint">Calcul…</p>`;
    let r; try { r = await api(`/admin/match?a=${a}&b=${b}`); } catch (e) { out.innerHTML = `<p class="hint">${esc(e.message)}</p>`; return; }
    out.innerHTML = `<div class="audit-score"><b>${r.score}%</b><span>${esc(r.a.name)} × ${esc(r.b.name)} — ${esc(r.verdict)}</span></div>` +
      r.factors.map((f) => {
        const parts = (f.parts || []).map((p) => `<span>${esc(p.label)} <b>${p.value}%</b></span>`).join("");
        const top = (f.top && f.top.length) ? `<p class="af-top">↳ ${f.top.map((t) => esc(t.pair.join(" ↔ ")) + " " + t.value + "%").join(", ")}</p>` : "";
        return `<div class="af"><div class="af-head"><b>${f.emoji} ${esc(f.label)} <em>· poids ${f.weight}%</em></b><span class="afv">${f.value}%</span></div>
          <div class="af-bar"><i style="width:${f.value}%"></i></div>
          ${parts ? `<div class="af-parts">${parts}</div>` : ""}${top}</div>`;
      }).join("");
  }

  function renderWeights(w) {
    $("weights-form").innerHTML = WKEYS.map((k) => {
      const v = Math.round((w[k.key] != null ? w[k.key] : 0) * 100);
      return `<div class="wrow"><label>${esc(k.label)} <b id="wv-${k.key}">${v}</b></label>
        <input type="range" id="w-${k.key}" min="0" max="100" value="${v}" /></div>`;
    }).join("");
    WKEYS.forEach((k) => $("w-" + k.key).addEventListener("input", (e) => { $("wv-" + k.key).textContent = e.target.value; }));
  }
  async function initWeights() {
    const r = await api("/admin/weights"); renderWeights(r.weights);
    $("weights-save").addEventListener("click", async () => {
      const body = {}; WKEYS.forEach((k) => { body[k.key] = (+$("w-" + k.key).value) / 100; });
      try { const rr = await api("/admin/weights", { method: "POST", body }); renderWeights(rr.weights); flash("Pondérations enregistrées ✓"); }
      catch (e) { flash(e.message); }
    });
    $("weights-reset").addEventListener("click", async () => {
      try { const rr = await api("/admin/weights", { method: "POST", body: DEFAULT_W }); renderWeights(rr.weights); flash("Valeurs par défaut restaurées ✓"); }
      catch (e) { flash(e.message); }
    });
  }
  let flashT = null;
  function flash(msg) { const el = $("weights-msg"); el.textContent = msg; clearTimeout(flashT); flashT = setTimeout(() => { el.textContent = ""; }, 3000); }

  document.addEventListener("DOMContentLoaded", async () => {
    let stats;
    try { stats = await api("/admin/stats"); }
    catch (e) {
      $("admin-gate").hidden = false;
      if (e.status === 403) $("gate-msg").textContent = "Votre compte n'est pas administrateur. Demandez à être ajouté à ADMIN_EMAILS.";
      return;
    }
    $("admin-main").hidden = false;
    renderKpis(stats); renderCharts(stats);
    $("export-csv").addEventListener("click", exportCsv);
    try { await renderMembers(); } catch (_) {}
    try { await renderReports(); } catch (_) {}
    try { await initAudit(); } catch (_) {}
    try { await initWeights(); } catch (_) {}
    try { await renderLog(); } catch (_) {}
  });
})();
