"use strict";
/* Internationalisation légère, sans dépendance.
 * - dictionnaires par langue ; t(clé) avec repli FR puis clé brute
 * - applyI18n() remplace le texte des éléments [data-i18n], le HTML des
 *   [data-i18n-html], les placeholders [data-i18n-ph], les titres [data-i18n-title]
 * - langue = localStorage > navigator > 'fr' ; setLocale persiste et ré-applique
 * NB : le contenu éditorial profond (portraits astro/MBTI/kinks) reste en FR. */
(function (global) {
  const DICT = {
    fr: {
      "nav.discover": "Découvrir", "nav.messages": "Messages", "nav.me": "Moi", "nav.profile": "Profil",
      "auth.heroTitle": "Trouvez votre <span>âme sœur</span>",
      "auth.heroSub": "Des rencontres par affinités profondes : MBTI, thème astral occidental & chinois, numérologie et bien plus.",
      "auth.createTitle": "Créer un compte", "auth.loginTitle": "Se connecter",
      "auth.email": "Email", "auth.password": "Mot de passe", "auth.passwordPh": "6 caractères minimum",
      "auth.age": "Je certifie avoir <b>18 ans ou plus</b>.",
      "auth.privacy": "J'ai lu et j'accepte la <a href=\"#\" id=\"privacy-link\">politique de confidentialité</a>.",
      "auth.signup": "S'inscrire", "auth.login": "Se connecter",
      "auth.haveAccount": "Déjà membre ? ", "auth.noAccount": "Nouveau ici ? ",
      "auth.toLogin": "Se connecter", "auth.toRegister": "Créer un compte",
      "onb.next": "Suivant", "onb.skip": "Passer", "onb.create": "Créer mon profil",
      "onb.1t": "Bienvenue sur Âme Sœur", "onb.1x": "Ici, on ne matche pas sur des photos, mais sur ce qui compte vraiment : votre personnalité et vos affinités profondes.",
      "onb.2t": "Cinq dimensions croisées", "onb.2x": "Personnalité (MBTI), astrologie, astrologie chinoise, numérologie et affinités intimes se combinent en un vrai score de compatibilité.",
      "onb.3t": "La magie se dévoile peu à peu", "onb.3x": "Personnalité, signes, puis photo se révèlent au fil de la conversation. On apprend à se connaître avant de se juger.",
      "onb.4t": "Et vous vous découvrez", "onb.4x": "Au passage, vous obtenez votre thème astral, votre type de personnalité et vos nombres. Prêt·e à rencontrer votre âme sœur ?",
      "disc.title": "À <span>découvrir</span>", "filters.summary": "Filtres — âge & distance",
      "sort.by": "Trier par", "sort.score": "Affinité", "sort.distance": "Proximité", "sort.active": "Actifs",
      "footer.demo": "Âme Sœur — prototype de démonstration.",
      "footer.privacy": "Politique de confidentialité", "footer.controller": " · Responsable de traitement : Âme Sœur (démo)",
      "cookie.text": "Nous utilisons uniquement un cookie strictement nécessaire à votre connexion, sans aucun traceur publicitaire. ",
      "cookie.link": "En savoir plus", "cookie.ok": "J'ai compris",
      "toast.saved": "Profil enregistré", "lang.label": "Langue",
      "install.title": "Installer l'app", "install.text": "Ajoutez Âme Sœur à votre écran d'accueil, comme une vraie app.",
      "install.btn": "Installer", "install.ios": "Appuyez sur <b>Partager</b> puis « <b>Sur l'écran d'accueil</b> ».",
    },
    en: {
      "nav.discover": "Discover", "nav.messages": "Messages", "nav.me": "Me", "nav.profile": "Profile",
      "auth.heroTitle": "Find your <span>soulmate</span>",
      "auth.heroSub": "Dating by deep compatibility: MBTI, Western & Chinese astrology, numerology and much more.",
      "auth.createTitle": "Create an account", "auth.loginTitle": "Sign in",
      "auth.email": "Email", "auth.password": "Password", "auth.passwordPh": "6 characters minimum",
      "auth.age": "I confirm I am <b>18 or older</b>.",
      "auth.privacy": "I have read and accept the <a href=\"#\" id=\"privacy-link\">privacy policy</a>.",
      "auth.signup": "Sign up", "auth.login": "Sign in",
      "auth.haveAccount": "Already a member? ", "auth.noAccount": "New here? ",
      "auth.toLogin": "Sign in", "auth.toRegister": "Create an account",
      "onb.next": "Next", "onb.skip": "Skip", "onb.create": "Create my profile",
      "onb.1t": "Welcome to Âme Sœur", "onb.1x": "Here, we don't match on photos, but on what truly matters: your personality and your deep affinities.",
      "onb.2t": "Five dimensions combined", "onb.2x": "Personality (MBTI), astrology, Chinese astrology, numerology and intimate affinities combine into a real compatibility score.",
      "onb.3t": "The magic unfolds gradually", "onb.3x": "Personality, signs, then photo reveal themselves as you chat. You get to know each other before judging.",
      "onb.4t": "And you discover yourself", "onb.4x": "Along the way you get your birth chart, personality type and numbers. Ready to meet your soulmate?",
      "disc.title": "To <span>discover</span>", "filters.summary": "Filters — age & distance",
      "sort.by": "Sort by", "sort.score": "Affinity", "sort.distance": "Distance", "sort.active": "Active",
      "footer.demo": "Âme Sœur — demonstration prototype.",
      "footer.privacy": "Privacy policy", "footer.controller": " · Data controller: Âme Sœur (demo)",
      "cookie.text": "We only use a strictly necessary cookie for your session, with no advertising tracker. ",
      "cookie.link": "Learn more", "cookie.ok": "Got it",
      "toast.saved": "Profile saved", "lang.label": "Language",
      "install.title": "Install the app", "install.text": "Add Âme Sœur to your home screen, like a real app.",
      "install.btn": "Install", "install.ios": "Tap <b>Share</b>, then “<b>Add to Home Screen</b>”.",
    },
  };
  const LOCALES = [["fr", "Français"], ["en", "English"]];
  function detect() {
    try { const s = localStorage.getItem("amesoeur_lang"); if (s && DICT[s]) return s; } catch (_) {}
    const n = (navigator.language || "fr").slice(0, 2).toLowerCase();
    return DICT[n] ? n : "fr";
  }
  let LOCALE = detect();
  function t(key) { return (DICT[LOCALE] && DICT[LOCALE][key]) || DICT.fr[key] || key; }
  function applyI18n(root) {
    const r = root || document;
    r.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.getAttribute("data-i18n")); });
    r.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    r.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))); });
    r.querySelectorAll("[data-i18n-title]").forEach((el) => { el.setAttribute("title", t(el.getAttribute("data-i18n-title"))); });
    document.documentElement.lang = LOCALE;
  }
  function setLocale(loc) {
    if (!DICT[loc]) return;
    LOCALE = loc;
    try { localStorage.setItem("amesoeur_lang", loc); } catch (_) {}
    applyI18n();
    document.dispatchEvent(new Event("localechange"));
  }
  global.I18n = { t, applyI18n, setLocale, getLocale: () => LOCALE, locales: LOCALES };
})(typeof window !== "undefined" ? window : globalThis);
