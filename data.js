"use strict";
/* Données statiques : villes, tests MBTI & BDSM, profils de démo. */
(function (global) {

  // Villes (nom, latitude, longitude, fuseau IANA). Le fuseau sert au calcul
  // de l'ascendant (heure locale historique gérée via Intl.DateTimeFormat).
  const CITIES = [
    // ---- France métropolitaine (préfectures + grandes communes) ----
    ["Paris", 48.8566, 2.3522, "Europe/Paris"], ["Marseille", 43.2965, 5.3698, "Europe/Paris"],
    ["Lyon", 45.764, 4.8357, "Europe/Paris"], ["Toulouse", 43.6047, 1.4442, "Europe/Paris"],
    ["Nice", 43.7102, 7.262, "Europe/Paris"], ["Nantes", 47.2184, -1.5536, "Europe/Paris"],
    ["Montpellier", 43.6108, 3.8767, "Europe/Paris"], ["Strasbourg", 48.5734, 7.7521, "Europe/Paris"],
    ["Bordeaux", 44.8378, -0.5792, "Europe/Paris"], ["Lille", 50.6292, 3.0573, "Europe/Paris"],
    ["Rennes", 48.1173, -1.6778, "Europe/Paris"], ["Reims", 49.2583, 4.0317, "Europe/Paris"],
    ["Le Havre", 49.4944, 0.1079, "Europe/Paris"], ["Saint-Étienne", 45.4397, 4.3872, "Europe/Paris"],
    ["Toulon", 43.1242, 5.928, "Europe/Paris"], ["Grenoble", 45.1885, 5.7245, "Europe/Paris"],
    ["Dijon", 47.322, 5.0415, "Europe/Paris"], ["Angers", 47.4784, -0.5632, "Europe/Paris"],
    ["Nîmes", 43.8367, 4.3601, "Europe/Paris"], ["Clermont-Ferrand", 45.7772, 3.087, "Europe/Paris"],
    ["Le Mans", 48.0061, 0.1996, "Europe/Paris"], ["Aix-en-Provence", 43.5297, 5.4474, "Europe/Paris"],
    ["Brest", 48.3904, -4.4861, "Europe/Paris"], ["Tours", 47.3941, 0.6848, "Europe/Paris"],
    ["Amiens", 49.8941, 2.2958, "Europe/Paris"], ["Limoges", 45.8336, 1.2611, "Europe/Paris"],
    ["Annecy", 45.8992, 6.1294, "Europe/Paris"], ["Perpignan", 42.6887, 2.8948, "Europe/Paris"],
    ["Besançon", 47.2378, 6.0241, "Europe/Paris"], ["Metz", 49.1193, 6.1757, "Europe/Paris"],
    ["Orléans", 47.9029, 1.9093, "Europe/Paris"], ["Rouen", 49.4432, 1.0993, "Europe/Paris"],
    ["Mulhouse", 47.7508, 7.3359, "Europe/Paris"], ["Caen", 49.1829, -0.3707, "Europe/Paris"],
    ["Nancy", 48.6921, 6.1844, "Europe/Paris"], ["Avignon", 43.9493, 4.8055, "Europe/Paris"],
    ["Poitiers", 46.5802, 0.3404, "Europe/Paris"], ["Versailles", 48.8014, 2.1301, "Europe/Paris"],
    ["Dunkerque", 51.0344, 2.3768, "Europe/Paris"], ["Pau", 43.2951, -0.3708, "Europe/Paris"],
    ["Antibes", 43.5808, 7.1251, "Europe/Paris"], ["La Rochelle", 46.1603, -1.1511, "Europe/Paris"],
    ["Cannes", 43.5528, 7.0174, "Europe/Paris"], ["Calais", 50.9513, 1.8587, "Europe/Paris"],
    ["Béziers", 43.3442, 3.2158, "Europe/Paris"], ["Colmar", 48.0794, 7.3585, "Europe/Paris"],
    ["Bourges", 47.081, 2.3988, "Europe/Paris"], ["Valence", 44.9334, 4.8924, "Europe/Paris"],
    ["Quimper", 47.996, -4.0978, "Europe/Paris"], ["Saint-Nazaire", 47.2735, -2.2138, "Europe/Paris"],
    ["Mérignac", 44.8386, -0.6436, "Europe/Paris"], ["Ajaccio", 41.9192, 8.7386, "Europe/Paris"],
    ["Bastia", 42.7028, 9.4508, "Europe/Paris"], ["Troyes", 48.2973, 4.0744, "Europe/Paris"],
    ["Lorient", 47.7477, -3.366, "Europe/Paris"], ["Chambéry", 45.5646, 5.9178, "Europe/Paris"],
    ["Niort", 46.3239, -0.4588, "Europe/Paris"], ["Montauban", 44.0178, 1.355, "Europe/Paris"],
    ["Vannes", 47.6582, -2.7608, "Europe/Paris"], ["Fréjus", 43.4332, 6.737, "Europe/Paris"],
    ["Cholet", 47.0594, -0.8794, "Europe/Paris"], ["Chartres", 48.4439, 1.489, "Europe/Paris"],
    ["Laval", 48.0698, -0.769, "Europe/Paris"], ["Belfort", 47.6379, 6.8628, "Europe/Paris"],
    ["Évreux", 49.027, 1.1508, "Europe/Paris"], ["Cherbourg", 49.6337, -1.6221, "Europe/Paris"],
    ["Bayonne", 43.4929, -1.4748, "Europe/Paris"], ["Narbonne", 43.184, 3.0035, "Europe/Paris"],
    ["Albi", 43.9298, 2.148, "Europe/Paris"], ["Angoulême", 45.6484, 0.1562, "Europe/Paris"],
    ["Tarbes", 43.2328, 0.0783, "Europe/Paris"], ["Gap", 44.559, 6.0794, "Europe/Paris"],
    ["Auxerre", 47.7982, 3.5734, "Europe/Paris"], ["Nevers", 46.9896, 3.159, "Europe/Paris"],
    ["Roanne", 46.0356, 4.068, "Europe/Paris"], ["Châteauroux", 46.8112, 1.6903, "Europe/Paris"],
    ["Blois", 47.5861, 1.3359, "Europe/Paris"], ["Périgueux", 45.1848, 0.7218, "Europe/Paris"],
    ["Agen", 44.2049, 0.6212, "Europe/Paris"], ["Mont-de-Marsan", 43.8907, -0.499, "Europe/Paris"],
    ["Rodez", 44.3506, 2.573, "Europe/Paris"], ["Cahors", 44.4478, 1.4406, "Europe/Paris"],
    ["Carcassonne", 43.213, 2.3491, "Europe/Paris"], ["Arras", 50.291, 2.7772, "Europe/Paris"],
    ["Boulogne-sur-Mer", 50.7256, 1.6146, "Europe/Paris"], ["Saint-Brieuc", 48.5136, -2.7658, "Europe/Paris"],
    ["Saint-Malo", 48.6493, -2.0257, "Europe/Paris"], ["Vichy", 46.1268, 3.4257, "Europe/Paris"],
    ["Montluçon", 46.3406, 2.6039, "Europe/Paris"], ["Bourg-en-Bresse", 46.2057, 5.2258, "Europe/Paris"],
    ["Chalon-sur-Saône", 46.7806, 4.8534, "Europe/Paris"], ["Mâcon", 46.3069, 4.8286, "Europe/Paris"],
    ["Épinal", 48.1744, 6.4499, "Europe/Paris"], ["Charleville-Mézières", 49.7719, 4.7161, "Europe/Paris"],
    ["Beauvais", 49.4295, 2.081, "Europe/Paris"], ["Compiègne", 49.4179, 2.8261, "Europe/Paris"],
    ["Saint-Quentin", 49.8467, 3.2876, "Europe/Paris"], ["Douai", 50.3714, 3.08, "Europe/Paris"],
    ["Valenciennes", 50.358, 3.5233, "Europe/Paris"], ["Boulogne-Billancourt", 48.8352, 2.2409, "Europe/Paris"],
    ["Créteil", 48.7904, 2.4556, "Europe/Paris"], ["Nanterre", 48.8924, 2.2069, "Europe/Paris"],
    ["Melun", 48.5392, 2.6608, "Europe/Paris"], ["Cergy", 49.0364, 2.0776, "Europe/Paris"],
    ["Évry", 48.6291, 2.4409, "Europe/Paris"],
    // ---- Outre-mer ----
    ["Fort-de-France", 14.6161, -61.0588, "America/Martinique"], ["Pointe-à-Pitre", 16.2412, -61.534, "America/Guadeloupe"],
    ["Cayenne", 4.9224, -52.3135, "America/Cayenne"], ["Saint-Denis (Réunion)", -20.8823, 55.4504, "Indian/Reunion"],
    ["Saint-Pierre (Réunion)", -21.3419, 55.4778, "Indian/Reunion"], ["Mamoudzou", -12.7806, 45.2278, "Indian/Mayotte"],
    ["Papeete", -17.5325, -149.5665, "Pacific/Tahiti"], ["Nouméa", -22.2758, 166.458, "Pacific/Noumea"],
    // ---- Belgique · Suisse · Luxembourg ----
    ["Bruxelles", 50.8503, 4.3517, "Europe/Brussels"], ["Liège", 50.6326, 5.5797, "Europe/Brussels"],
    ["Charleroi", 50.4108, 4.4446, "Europe/Brussels"], ["Namur", 50.4674, 4.872, "Europe/Brussels"],
    ["Mons", 50.4542, 3.9563, "Europe/Brussels"], ["Anvers", 51.2194, 4.4025, "Europe/Brussels"],
    ["Gand", 51.0543, 3.7174, "Europe/Brussels"], ["Genève", 46.2044, 6.1432, "Europe/Zurich"],
    ["Lausanne", 46.5197, 6.6323, "Europe/Zurich"], ["Zurich", 47.3769, 8.5417, "Europe/Zurich"],
    ["Berne", 46.948, 7.4474, "Europe/Zurich"], ["Fribourg", 46.8065, 7.1615, "Europe/Zurich"],
    ["Neuchâtel", 46.993, 6.931, "Europe/Zurich"], ["Sion", 46.2331, 7.3606, "Europe/Zurich"],
    ["Luxembourg", 49.6116, 6.1319, "Europe/Luxembourg"],
    // ---- Canada francophone ----
    ["Montréal", 45.5017, -73.5673, "America/Toronto"], ["Québec", 46.8139, -71.208, "America/Toronto"],
    ["Ottawa", 45.4215, -75.6972, "America/Toronto"], ["Gatineau", 45.4765, -75.7013, "America/Toronto"],
    ["Sherbrooke", 45.404, -71.8929, "America/Toronto"], ["Trois-Rivières", 46.3432, -72.543, "America/Toronto"],
    // ---- Afrique & Maghreb francophones ----
    ["Dakar", 14.7167, -17.4677, "Africa/Dakar"], ["Abidjan", 5.36, -4.0083, "Africa/Abidjan"],
    ["Casablanca", 33.5731, -7.5898, "Africa/Casablanca"], ["Rabat", 34.0209, -6.8416, "Africa/Casablanca"],
    ["Marrakech", 31.6295, -7.9811, "Africa/Casablanca"], ["Alger", 36.7538, 3.0588, "Africa/Algiers"],
    ["Oran", 35.6969, -0.6331, "Africa/Algiers"], ["Tunis", 36.8065, 10.1815, "Africa/Tunis"],
    ["Yaoundé", 3.848, 11.5021, "Africa/Douala"], ["Douala", 4.0511, 9.7679, "Africa/Douala"],
    ["Kinshasa", -4.4419, 15.2663, "Africa/Kinshasa"], ["Brazzaville", -4.2634, 15.2429, "Africa/Brazzaville"],
    ["Libreville", 0.4162, 9.4673, "Africa/Libreville"], ["Cotonou", 6.3703, 2.3912, "Africa/Porto-Novo"],
    ["Lomé", 6.1319, 1.2228, "Africa/Lome"], ["Bamako", 12.6392, -8.0029, "Africa/Bamako"],
    ["Ouagadougou", 12.3714, -1.5197, "Africa/Ouagadougou"], ["Niamey", 13.5117, 2.1251, "Africa/Niamey"],
    ["Conakry", 9.6412, -13.5784, "Africa/Conakry"], ["Antananarivo", -18.8792, 47.5079, "Indian/Antananarivo"],
    ["Nouakchott", 18.0735, -15.9582, "Africa/Nouakchott"], ["N'Djamena", 12.1348, 15.0557, "Africa/Ndjamena"],
    ["Beyrouth", 33.8938, 35.5018, "Asia/Beirut"], ["Port-au-Prince", 18.5944, -72.3074, "America/Port-au-Prince"],
    // ---- Grandes métropoles du monde ----
    ["Londres", 51.5074, -0.1278, "Europe/London"], ["Madrid", 40.4168, -3.7038, "Europe/Madrid"],
    ["Barcelone", 41.3874, 2.1686, "Europe/Madrid"], ["Rome", 41.9028, 12.4964, "Europe/Rome"],
    ["Berlin", 52.52, 13.405, "Europe/Berlin"], ["Amsterdam", 52.3676, 4.9041, "Europe/Amsterdam"],
    ["Lisbonne", 38.7223, -9.1393, "Europe/Lisbon"], ["Vienne", 48.2082, 16.3738, "Europe/Vienna"],
    ["New York", 40.7128, -74.006, "America/New_York"], ["Los Angeles", 34.0522, -118.2437, "America/Los_Angeles"],
    ["Mexico", 19.4326, -99.1332, "America/Mexico_City"], ["São Paulo", -23.5505, -46.6333, "America/Sao_Paulo"],
    ["Buenos Aires", -34.6037, -58.3816, "America/Argentina/Buenos_Aires"], ["Montevideo", -34.9011, -56.1645, "America/Montevideo"],
    ["Tokyo", 35.6762, 139.6503, "Asia/Tokyo"], ["Hong Kong", 22.3193, 114.1694, "Asia/Hong_Kong"],
    ["Bangkok", 13.7563, 100.5018, "Asia/Bangkok"], ["Mumbai", 19.076, 72.8777, "Asia/Kolkata"],
    ["Dubaï", 25.2048, 55.2708, "Asia/Dubai"], ["Le Caire", 30.0444, 31.2357, "Africa/Cairo"],
    ["Johannesburg", -26.2041, 28.0473, "Africa/Johannesburg"], ["Sydney", -33.8688, 151.2093, "Australia/Sydney"],
    ["Moscou", 55.7558, 37.6173, "Europe/Moscow"], ["Istanbul", 41.0082, 28.9784, "Europe/Istanbul"],
  ];
  const CITY_BY_NAME = Object.fromEntries(CITIES.map((c) => [c[0], { lat: c[1], lon: c[2], zone: c[3] }]));

  const AVATARS = ["🦊", "🦋", "🌙", "🌻", "🐬", "🦁", "🦚", "🐺", "🌊", "🔥", "🌸", "🍃", "⭐", "🕊️", "🦌", "🐝"];

  /* ------------------------ Test MBTI (32 questions) ------------------
   * Instrument original (non affilié à MBTI®) sur les 4 dichotomies
   * jungiennes. 8 énoncés par axe (4 « + » vers la 1re lettre, 4 « − »),
   * notés de 1 (pas du tout) à 5 (tout à fait).
   * dim : 0 = E/I, 1 = N/S, 2 = T/F, 3 = J/P.
   * sign : +1 si « d'accord » va vers la 1re lettre (E/N/T/J), -1 vers la 2de.
   * Énoncés entremêlés et à polarité alternée pour limiter les biais. */
  const MBTI_AXES = [["E", "I"], ["N", "S"], ["T", "F"], ["J", "P"]];
  const MBTI_QUESTIONS = [
    { dim: 0, sign: 1, t: "Être entouré·e de monde me recharge." },
    { dim: 1, sign: 1, t: "Je me fie d'abord à mon intuition et aux idées." },
    { dim: 2, sign: 1, t: "Je décide surtout avec la logique et l'analyse." },
    { dim: 3, sign: 1, t: "J'aime planifier et décider tôt." },
    { dim: 0, sign: -1, t: "J'ai besoin de solitude pour me ressourcer." },
    { dim: 1, sign: -1, t: "Je préfère les faits concrets et l'expérience vécue." },
    { dim: 2, sign: -1, t: "Je décide surtout avec le cœur et mes valeurs." },
    { dim: 3, sign: -1, t: "Je préfère garder mes options ouvertes." },
    { dim: 0, sign: 1, t: "Après une soirée animée, je me sens plein·e d'énergie." },
    { dim: 1, sign: 1, t: "J'aime imaginer les possibles et le futur." },
    { dim: 2, sign: 1, t: "Je privilégie la vérité, même quand elle dérange." },
    { dim: 3, sign: 1, t: "J'aime l'ordre, les listes et les échéances tenues." },
    { dim: 0, sign: -1, t: "Je réfléchis longuement en moi avant de parler." },
    { dim: 1, sign: -1, t: "Je remarque surtout les détails pratiques et le présent." },
    { dim: 2, sign: -1, t: "Je cherche l'harmonie et le tact avant tout." },
    { dim: 3, sign: -1, t: "J'improvise volontiers et m'adapte au dernier moment." },
    { dim: 0, sign: 1, t: "J'aborde facilement des inconnu·es." },
    { dim: 1, sign: 1, t: "Les concepts, symboles et métaphores me parlent." },
    { dim: 2, sign: 1, t: "On me dit objectif·ve et franc·he." },
    { dim: 3, sign: 1, t: "Je me sens mieux quand tout est organisé d'avance." },
    { dim: 0, sign: -1, t: "Les grands groupes finissent par me vider." },
    { dim: 1, sign: -1, t: "Je fais confiance à ce qui est éprouvé plutôt qu'aux théories." },
    { dim: 2, sign: -1, t: "Je ressens fortement les émotions des autres." },
    { dim: 3, sign: -1, t: "Les plans trop rigides m'étouffent." },
    { dim: 0, sign: 1, t: "Je pense souvent à voix haute, en parlant." },
    { dim: 1, sign: 1, t: "La routine et le trop concret m'ennuient vite." },
    { dim: 2, sign: 1, t: "Je reste calme et rationnel·le dans un désaccord." },
    { dim: 3, sign: 1, t: "Une décision prise me soulage plus qu'elle ne m'enferme." },
    { dim: 0, sign: -1, t: "Je préfère quelques amis proches à un large cercle." },
    { dim: 1, sign: -1, t: "J'ai les pieds sur terre ; le tangible me rassure." },
    { dim: 2, sign: -1, t: "Je fais passer les gens avant les principes." },
    { dim: 3, sign: -1, t: "Je carbure souvent à la dernière minute." },
    // --- Second bloc (test approfondi, 64 énoncés au total) ---
    { dim: 0, sign: 1, t: "J'aime lancer la conversation au sein d'un groupe." },
    { dim: 1, sign: 1, t: "J'aime relier des idées entre elles pour en dégager un sens." },
    { dim: 2, sign: 1, t: "Dans un choix, je pèse le pour et le contre avec logique." },
    { dim: 3, sign: 1, t: "Faire des listes et les cocher me satisfait." },
    { dim: 0, sign: -1, t: "J'ai besoin de temps seul·e après une journée sociale." },
    { dim: 1, sign: -1, t: "Je me fie à ce que je peux voir, toucher, mesurer." },
    { dim: 2, sign: -1, t: "Je tiens compte de l'impact d'une décision sur les gens." },
    { dim: 3, sign: -1, t: "Je préfère rester flexible plutôt que fixer un plan." },
    { dim: 0, sign: 1, t: "Rencontrer de nouvelles personnes m'enthousiasme." },
    { dim: 1, sign: 1, t: "Je pense souvent à ce qui pourrait être, au-delà du réel." },
    { dim: 2, sign: 1, t: "Je peux critiquer une idée sans y mêler l'affect." },
    { dim: 3, sign: 1, t: "Boucler une tâche avant d'en commencer une autre me satisfait." },
    { dim: 0, sign: -1, t: "Je préfère écouter plutôt qu'occuper le devant de la scène." },
    { dim: 1, sign: -1, t: "Des instructions concrètes valent mieux que de grandes idées." },
    { dim: 2, sign: -1, t: "L'harmonie du groupe compte autant que la solution trouvée." },
    { dim: 3, sign: -1, t: "Les décisions de dernière minute ne me dérangent pas." },
    { dim: 0, sign: 1, t: "Je partage volontiers ce que je ressens sur le moment." },
    { dim: 1, sign: 1, t: "Les théories et les modèles abstraits me passionnent." },
    { dim: 2, sign: 1, t: "L'équité selon des règles claires me semble essentielle." },
    { dim: 3, sign: 1, t: "Je planifie mes voyages dans le détail." },
    { dim: 0, sign: -1, t: "Trop de sollicitations finissent par me fatiguer." },
    { dim: 1, sign: -1, t: "Je remarque vite les détails matériels d'un lieu." },
    { dim: 2, sign: -1, t: "Je devine facilement l'humeur de quelqu'un." },
    { dim: 3, sign: -1, t: "J'aime laisser la journée s'inventer d'elle-même." },
    { dim: 0, sign: 1, t: "L'animation d'une fête me stimule." },
    { dim: 1, sign: 1, t: "Je m'ennuie quand tout reste trop terre-à-terre." },
    { dim: 2, sign: 1, t: "Je garde la tête froide quand il faut trancher." },
    { dim: 3, sign: 1, t: "Le désordre autour de moi me gêne pour me concentrer." },
    { dim: 0, sign: -1, t: "Je réfléchis en silence avant de m'exprimer." },
    { dim: 1, sign: -1, t: "Je préfère améliorer l'existant plutôt qu'inventer du neuf." },
    { dim: 2, sign: -1, t: "Un désaccord tendu m'affecte personnellement." },
    { dim: 3, sign: -1, t: "Trop de règles brident ma créativité." },
  ];
  // Courtes descriptions originales (pas les noms de marque d'un test tiers).
  const MBTI_TYPE_NAMES = {
    INTJ: "visionnaire et stratège", INTP: "analytique et curieux·se",
    ENTJ: "meneur·se et déterminé·e", ENTP: "inventif·ve et vif·ve d'esprit",
    INFJ: "idéaliste et profond·e", INFP: "sensible et rêveur·se",
    ENFJ: "chaleureux·se et fédérateur·rice", ENFP: "enthousiaste et libre",
    ISTJ: "fiable et méthodique", ISFJ: "dévoué·e et attentionné·e",
    ESTJ: "organisé·e et franc·he", ESFJ: "sociable et bienveillant·e",
    ISTP: "pragmatique et indépendant·e", ISFP: "artiste et spontané·e",
    ESTP: "audacieux·se et énergique", ESFP: "festif·ve et généreux·se",
  };
  // Solde signé par axe : positif → 1re lettre. answers : entiers 1..5.
  function mbtiBalances(answers) {
    const bal = [0, 0, 0, 0];
    answers.forEach((v, i) => {
      const q = MBTI_QUESTIONS[i]; if (!q) return;
      bal[q.dim] += q.sign * ((Math.max(1, Math.min(5, Number(v) || 3)) - 3));
    });
    return bal;
  }
  function scoreMbti(answers) {
    return mbtiBalances(answers).map((b, d) => MBTI_AXES[d][b >= 0 ? 0 : 1]).join("");
  }
  // Détail : type, nom et inclinaison (%) vers la lettre retenue sur chaque axe.
  function scoreMbtiDetail(answers) {
    const counts = [0, 0, 0, 0];
    MBTI_QUESTIONS.forEach((q) => { counts[q.dim]++; });
    const bal = mbtiBalances(answers);
    const axes = bal.map((b, d) => {
      const letter = MBTI_AXES[d][b >= 0 ? 0 : 1];
      const lean = Math.round(50 + (Math.abs(b) / (2 * counts[d])) * 50); // 50..100
      return { pair: MBTI_AXES[d], letter, lean };
    });
    const type = axes.map((a) => a.letter).join("");
    return { type, name: MBTI_TYPE_NAMES[type] || "", axes };
  }

  /* ------------------------ Test BDSM (29 questions, 18+) -------------
   * Chaque énoncé se note de 1 (pas du tout) à 10 (tout à fait) et alimente
   * un trait (0..1). Adaptation légère inspirée de bdsmtest.org. */
  const BDSM_QUESTIONS = [
    { trait: "dominant", t: "J'aime prendre le contrôle et diriger." },
    { trait: "submissive", t: "J'aime m'abandonner et suivre les directives." },
    { trait: "sadist", t: "Le sadisme m'excite : donner des sensations fortes (douleur consentie, morsures, marques)." },
    { trait: "masochist", t: "Le masochisme me plaît : recevoir des sensations fortes (douleur consentie, morsures, marques)." },
    { trait: "rigger", t: "J'aime attacher / immobiliser un·e partenaire." },
    { trait: "ropebunny", t: "J'aime être attaché·e / immobilisé·e." },
    { trait: "brattamer", t: "J'aime canaliser un·e partenaire espiègle." },
    { trait: "brat", t: "Provoquer avec malice pour être recadré·e m'amuse." },
    { trait: "owner", t: "Posséder / guider un·e partenaire dévoué·e me plaît." },
    { trait: "pet", t: "M'en remettre pleinement à quelqu'un m'attire." },
    { trait: "daddy", t: "Un rôle protecteur et rassurant me parle." },
    { trait: "little", t: "Recevoir douceur et protection dans un rôle plus tendre me parle." },
    { trait: "voyeur", t: "Regarder / être spectateur·rice m'excite." },
    { trait: "exhibitionist", t: "Être regardé·e / me montrer m'excite." },
    { trait: "experimental", t: "Je suis curieux·se d'explorer de nouvelles pratiques." },
    { trait: "switch", t: "Je peux être dominant·e ou soumis·e selon les périodes et les partenaires." },
    { trait: "candauliste", t: "Montrer ou partager mon/ma partenaire avec d'autres m'excite." },
    { trait: "hotwife", t: "Avoir des aventures ouvertes, au su et à l'excitation de mon/ma partenaire, me plaît." },
    { trait: "polygame", t: "Je me verrais bien dans une relation à plusieurs ou non-exclusive." },
    { trait: "blackaddict", t: "Je suis particulièrement attiré·e par les partenaires noir·es." },
    { trait: "bigcock", t: "Je suis particulièrement attiré·e par les partenaires très bien membrés." },
    { trait: "asexual", t: "Je ressens peu ou pas d'attirance sexuelle." },
    { trait: "hypersexual", t: "J'ai une libido très élevée ; le sexe tient une grande place pour moi." },
    { trait: "daddybaby", t: "La dynamique Daddy/Baby (protéger d'un côté, être choyé·e de l'autre) me parle." },
    { trait: "echangiste", t: "Échanger de partenaire avec un autre couple m'attire (échangisme)." },
    { trait: "blackdesired", t: "Je suis noir·e et j'aime être désiré·e pour cela." },
    { trait: "hung", t: "Je suis très bien membré et j'aime être désiré pour cela." },
    { trait: "blacksharer", t: "J'aime partager ma/mon partenaire avec des hommes noirs, sans l'être moi-même." },
    { trait: "hungsharer", t: "J'aime partager ma/mon partenaire avec des hommes très bien membrés, sans l'être moi-même." },
    { trait: "fluids", t: "Le jeu avec les fluides corporels (salive, sueur, et plus) fait partie de mes envies." },
    { trait: "edgeplay", t: "J'aime aller vers des pratiques taboues ou borderline, sans limite arbitraire (edge play)." },
    { trait: "vanilla", t: "À l'inverse, je préfère rester tendre et classique, sans pratiques extrêmes." },
  ];
  function scoreBdsm(answers) {
    // answers : tableau d'entiers 1..10 aligné sur BDSM_QUESTIONS
    const out = {};
    answers.forEach((v, i) => { out[BDSM_QUESTIONS[i].trait] = (Math.max(1, Math.min(10, v || 1)) - 1) / 9; });
    return out;
  }

  /* --------------------------- Profils de démo ----------------------- */
  const c = (name) => CITY_BY_NAME[name];
  const SEED = [
    { id: "s1", name: "Camille", avatar: "🦋", gender: "F", seeking: "T", bio: "Autrice le jour, danseuse la nuit. Cherche une âme curieuse.",
      year: 1993, month: 6, day: 21, time: "04:30", city: "Paris", mbti: "INFP",
      bdsm: { submissive: 0.8, masochist: 0.6, ropebunny: 0.75, little: 0.7, brat: 0.4, experimental: 0.8, switch: 0.2, exhibitionist: 0.5 } },
    { id: "s2", name: "Alex", avatar: "🦊", gender: "H", seeking: "T", bio: "Ingénieur, grimpeur, amateur de vin nature et de longues conversations.",
      year: 1990, month: 11, day: 3, time: "09:15", city: "Lyon", mbti: "ENTJ",
      bdsm: { dominant: 0.85, sadist: 0.6, rigger: 0.8, owner: 0.7, brattamer: 0.7, experimental: 0.6, switch: 0.2, voyeur: 0.5 } },
    { id: "s3", name: "Sam", avatar: "🌙", gender: "NB", seeking: "T", superLikedYou: true, bio: "Photographe nomade. Je collectionne les couchers de soleil et les vinyles.",
      year: 1996, month: 2, day: 14, time: "18:40", city: "Bruxelles", mbti: "ENFP",
      bdsm: { switch: 0.85, dominant: 0.5, submissive: 0.5, experimental: 0.9, brat: 0.6, exhibitionist: 0.6, voyeur: 0.6 } },
    { id: "s4", name: "Léa", avatar: "🌻", gender: "F", seeking: "H", bio: "Médecin, marathonienne. Pragmatique mais grande romantique au fond.",
      year: 1988, month: 8, day: 30, time: "12:00", city: "Bordeaux", mbti: "ISTJ",
      bdsm: null },
    { id: "s5", name: "Malik", avatar: "🦁", gender: "H", seeking: "F", bio: "Chef cuisinier. Je séduis à l'assiette. Team feu de bois et épices.",
      year: 1991, month: 4, day: 12, time: "22:10", city: "Marseille", mbti: "ESFP",
      bdsm: { dominant: 0.6, primalhunter: 0.7, sadist: 0.4, owner: 0.5, exhibitionist: 0.6, experimental: 0.7, switch: 0.4 } },
    { id: "s6", name: "Nadia", avatar: "🦚", gender: "F", seeking: "T", superLikedYou: true, bio: "Avocate le jour, potière le week-end. J'aime l'esprit vif et la tendresse.",
      year: 1994, month: 12, day: 19, time: "07:25", city: "Genève", mbti: "INTJ",
      bdsm: { dominant: 0.75, brattamer: 0.65, rigger: 0.6, degrader: 0.4, owner: 0.6, experimental: 0.5, switch: 0.3 } },
    { id: "s7", name: "Théo", avatar: "🐬", gender: "H", seeking: "T", bio: "Prof de philo, plongeur, insomniaque poétique. On refait le monde ?",
      year: 1995, month: 9, day: 5, time: "02:50", city: "Nantes", mbti: "INFJ",
      bdsm: { submissive: 0.7, ropebunny: 0.55, little: 0.5, masochist: 0.5, experimental: 0.6, switch: 0.4, pet: 0.5 } },
    { id: "s8", name: "Inès", avatar: "🌊", gender: "F", seeking: "T", bio: "Développeuse et surfeuse. Introvertie assumée, humour très sec.",
      year: 1992, month: 1, day: 28, time: "15:05", city: "Nice", mbti: "ISTP",
      bdsm: { switch: 0.7, submissive: 0.5, dominant: 0.5, masochist: 0.5, sadist: 0.4, experimental: 0.7, ropebunny: 0.5 } },
    { id: "s9", name: "Yanis", avatar: "🐺", gender: "H", seeking: "T", bio: "Kiné, boxeur du dimanche, papa d'un petit gars de 4 ans. La vie est belle.",
      year: 1987, month: 5, day: 9, time: "11:30", city: "Toulouse", mbti: "ESTP",
      bdsm: { dominant: 0.6, sadist: 0.5, rigger: 0.55, primalhunter: 0.6, owner: 0.5, experimental: 0.6, switch: 0.3 } },
    { id: "s10", name: "Chloé", avatar: "🌸", gender: "F", seeking: "H", bio: "Vétérinaire, deux chats et un lévrier. Si tu es allergique, on trouvera une solution 😅",
      year: 1997, month: 10, day: 2, time: "20:15", city: "Lille", mbti: "ENFJ",
      bdsm: { submissive: 0.65, little: 0.6, masochist: 0.45, ropebunny: 0.5, pet: 0.55, experimental: 0.6, switch: 0.35 } },
    { id: "s11", name: "Robin", avatar: "🍃", gender: "NB", seeking: "T", bio: "Libraire, poète du dimanche, fan de thé fumé et de longues balades.",
      year: 1993, month: 3, day: 27, time: "05:45", city: "Strasbourg", mbti: "INFP",
      bdsm: null },
    { id: "s12", name: "Amara", avatar: "🕊️", gender: "F", seeking: "T", bio: "Sage-femme le jour, DJ occasionnelle. J'aime rire fort et aimer franchement.",
      year: 1990, month: 7, day: 18, time: "23:40", city: "Dakar", mbti: "ESFJ",
      bdsm: { dominant: 0.55, brattamer: 0.55, owner: 0.5, exhibitionist: 0.5, experimental: 0.55, switch: 0.45 } },
  ];

  /* ----------------------- Centres d'intérêt ------------------------- */
  const INTERESTS = [
    ["Street food", "🍜"], ["Café", "☕"], ["Vin nature", "🍷"], ["Cuisine", "🍳"],
    ["Bubble tea", "🧋"], ["Voyages", "✈️"], ["Randonnée", "🥾"], ["Nature", "🏞️"],
    ["Yoga", "🧘"], ["Méditation", "🕉️"], ["Spa", "🕯️"], ["Prendre soin de soi", "🌼"],
    ["Sport", "🏋️"], ["Danse", "💃"], ["Musique", "🎧"], ["Concerts", "🎤"],
    ["Cinéma", "🎬"], ["Lecture", "📚"], ["Écriture", "✍️"], ["Art", "🎨"],
    ["Photographie", "📷"], ["Jeux vidéo", "🎮"], ["Mode", "👗"], ["Animaux", "🐾"],
    ["Spiritualité", "🔮"], ["Astrologie", "✨"], ["Bénévolat", "🤝"], ["Fêtes", "🎉"],
    ["Surf", "🏄"], ["Vélo", "🚲"], ["Théâtre", "🎭"], ["Bricolage", "🔨"],
  ];
  const INTEREST_EMOJI = Object.fromEntries(INTERESTS.map(([l, e]) => [l, e]));

  const SEED_INTERESTS = {
    s1: ["Danse", "Écriture", "Concerts", "Café", "Voyages"],
    s2: ["Randonnée", "Vin nature", "Sport", "Voyages", "Cuisine"],
    s3: ["Photographie", "Musique", "Voyages", "Art", "Fêtes"],
    s4: ["Sport", "Cuisine", "Nature", "Cinéma", "Prendre soin de soi"],
    s5: ["Cuisine", "Street food", "Musique", "Fêtes", "Vin nature"],
    s6: ["Art", "Lecture", "Spiritualité", "Café", "Astrologie"],
    s7: ["Lecture", "Écriture", "Cinéma", "Nature", "Méditation"],
    s8: ["Surf", "Jeux vidéo", "Musique", "Nature", "Café"],
    s9: ["Sport", "Nature", "Animaux", "Cuisine", "Vélo"],
    s10: ["Animaux", "Nature", "Prendre soin de soi", "Bubble tea", "Bénévolat"],
    s11: ["Lecture", "Café", "Nature", "Écriture", "Théâtre"],
    s12: ["Danse", "Musique", "Fêtes", "Bien-être", "Voyages"],
  };
  SEED.forEach((s) => { s.interests = SEED_INTERESTS[s.id] || []; });

  /* --------- Petits textes « anti-mauvais-critères » (éparpillés) ------ */
  const NUDGES = [
    { icon: "🐾", title: "« Pas d'animaux » ?",
      text: "Beaucoup d'histoires commencent par un chat qu'on finit par adorer. Écarter quelqu'un pour un poil, c'est parfois fermer la porte à un grand amour. Une allergie se gère ; une belle rencontre ne se remplace pas." },
    { icon: "👶", title: "« Sans enfants », vraiment ?",
      text: "Refuser d'emblée une personne qui a des enfants, c'est écarter quelqu'un qui sait déjà aimer, protéger et s'engager. Les familles se réinventent — l'amour ne se planifie pas sur un tableur." },
    { icon: "🌱", title: "Besoin qu'on se dédie à 100 % ?",
      text: "Un amour sain, c'est deux personnes entières — pas une qui se dissout dans l'autre. Le vrai « pour toujours » laisse à chacun de l'air pour respirer. Chercher une dévotion totale, c'est souvent la dépendance affective qui parle, pas le cœur. Bonne nouvelle : ces schémas se retravaillent — les thérapies cognitives et comportementales (TCC) sont reconnues pour aider à retrouver un attachement plus serein." },
    { icon: "💫", title: "Trop de critères physiques ?",
      text: "Filtrer sur la taille, le poids ou la couleur des yeux, c'est trier des inconnus sur 2 % de ce qu'ils sont. Le charme, la voix, le rire, la manière d'écouter… rien de tout ça ne tient dans une case." },
    { icon: "🔥", title: "Des exigences très précises… au lit ?",
      text: "Le désir se construit, se parle, s'apprivoise à deux. Poser trop de conditions d'avance, c'est souvent la peur déguisée en cahier des charges. Laissez de la place à la surprise." },
    { icon: "🧭", title: "Vos meilleurs matchs sont hors de vos filtres",
      text: "L'âme sœur est peut-être à 2 ans ou à 20 km de vos réglages. Élargissez d'un cran : la compatibilité profonde ne coche pas toujours les cases qu'on avait prévues." },
  ];

  global.Data = {
    CITIES, CITY_BY_NAME, AVATARS,
    MBTI_QUESTIONS, MBTI_TYPE_NAMES, scoreMbti, scoreMbtiDetail,
    BDSM_QUESTIONS, scoreBdsm, SEED, NUDGES,
    INTERESTS, INTEREST_EMOJI,
  };
})(typeof window !== "undefined" ? window : globalThis);
