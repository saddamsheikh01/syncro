/**
 * Add missing phrase keys from phrases.en.json to other locale files.
 * Missing keys are added with translated values (or English fallback).
 */
const fs = require("fs");
const path = require("path");

const messagesDir = path.join(__dirname, "../src/i18n/messages");
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "phrases.en.json"), "utf8"));
const enKeys = Object.keys(en);

// Translations for keys that are missing in some locales (key -> { es, pt, it, fr, sq })
const translations = {
  "Check out {name}'s profile on Syncro": {
    es: "Mira el perfil de {name} en Syncro",
    pt: "Vê o perfil de {name} no Syncro",
    it: "Guarda il profilo di {name} su Syncro",
    fr: "Découvre le profil de {name} sur Syncro",
    sq: "Shiko profilin e {name} në Syncro",
  },
  "Create account": {
    es: "Crear cuenta",
    pt: "Criar conta",
    it: "Crea account",
    fr: "Créer un compte",
    sq: "Krijo llogari",
  },
  "Join Syncro": {
    es: "Únete a Syncro",
    pt: "Junta-te ao Syncro",
    it: "Unisciti a Syncro",
    fr: "Rejoins Syncro",
    sq: "Bashkohu me Syncro",
  },
  "match.dimension.astrology": { es: "astrología", pt: "astrologia", it: "astrologia", fr: "astrologie", sq: "astrologji" },
  "match.dimension.goals": { es: "objetivos", pt: "objetivos", it: "obiettivi", fr: "objectifs", sq: "qëllime" },
  "match.dimension.interests": { es: "intereses", pt: "interesses", it: "interessi", fr: "centres d'intérêt", sq: "interesa" },
  "match.dimension.lifestyle": { es: "estilo de vida", pt: "estilo de vida", it: "stile di vita", fr: "style de vie", sq: "stil jetese" },
  "match.dimension.psychologicalProfile": { es: "perfil psicológico", pt: "perfil psicológico", it: "profilo psicologico", fr: "profil psychologique", sq: "profil psikologjik" },
  "match.dimension.values": { es: "valores", pt: "valores", it: "valori", fr: "valeurs", sq: "vlera" },
  "match.domain.friendship": { es: "Amistad", pt: "Amizade", it: "Amicizia", fr: "Amitié", sq: "Miqësi" },
  "match.domain.growth": { es: "Crecimiento", pt: "Crescimento", it: "Crescita", fr: "Croissance", sq: "Rritje" },
  "match.domain.hobby": { es: "Pasatiempo", pt: "Passatempo", it: "Hobby", fr: "Loisir", sq: "Hobi" },
  "match.domain.love": { es: "Amor", pt: "Amor", it: "Amore", fr: "Amour", sq: "Dashuri" },
  "match.domain.projects": { es: "Proyectos", pt: "Projetos", it: "Progetti", fr: "Projets", sq: "Projekte" },
  "match.domain.work": { es: "Trabajo", pt: "Trabalho", it: "Lavoro", fr: "Travail", sq: "Punë" },
  "match.strength.exceptional": { es: "Excepcional", pt: "Excecional", it: "Eccezionale", fr: "Exceptionnel", sq: "Jashtëzakonshëm" },
  "match.strength.veryStrong": { es: "Muy fuerte", pt: "Muito forte", it: "Molto forte", fr: "Très fort", sq: "Shumë i fortë" },
  "match.strength.strong": { es: "Fuerte", pt: "Forte", it: "Forte", fr: "Fort", sq: "I fortë" },
  "match.strength.goodFit": { es: "Buena conexión", pt: "Boa ligação", it: "Buona connessione", fr: "Bon alignement", sq: "Përputhje e mirë" },
  "match.compatibilityTextOne": { es: "Compatibilidad {strength} en {a}.", pt: "Compatibilidade {strength} em {a}.", it: "Compatibilità {strength} in {a}.", fr: "Compatibilité {strength} en {a}.", sq: "Përputhje {strength} në {a}." },
  "match.compatibilityTextOneAlt": { es: "Mejor conexión en {a}.", pt: "Melhor ligação em {a}.", it: "Miglior connessione in {a}.", fr: "Meilleure connexion en {a}.", sq: "Përputhja më e mirë në {a}." },
  "match.compatibilityTextTwo": { es: "{strength1} en {a}, {strength2} en {b}.", pt: "{strength1} em {a}, {strength2} em {b}.", it: "{strength1} in {a}, {strength2} in {b}.", fr: "{strength1} en {a}, {strength2} en {b}.", sq: "{strength1} në {a}, {strength2} në {b}." },
  "match.compatibilityTextTwoAlt": { es: "Buena alineación en {a} y {b}.", pt: "Boa alinhamento em {a} e {b}.", it: "Buon allineamento in {a} e {b}.", fr: "Bon alignement en {a} et {b}.", sq: "Përputhje e mirë në {a} dhe {b}." },
  "match.compatibilityTextTwoAlt2": { es: "Fuerte conexión en {a} y {b}.", pt: "Forte ligação em {a} e {b}.", it: "Forte connessione per {a} e {b}.", fr: "Forte connexion pour {a} et {b}.", sq: "Përputhje e fortë për {a} dhe {b}." },
  "match.compatibilityTextThree": { es: "{strength} en {a}, {b} y {c}.", pt: "{strength} em {a}, {b} e {c}.", it: "{strength} in {a}, {b} e {c}.", fr: "{strength} en {a}, {b} et {c}.", sq: "{strength} në {a}, {b} dhe {c}." },
  "match.compatibilityTextThreeAlt": { es: "Buena alineación en {a}, {b} y {c}.", pt: "Boa alinhamento em {a}, {b} e {c}.", it: "Buon allineamento in {a}, {b} e {c}.", fr: "Bon alignement en {a}, {b} et {c}.", sq: "Përputhje e mirë në {a}, {b} dhe {c}." },
  "match.strongCompatibilityIn": { es: "Fuerte compatibilidad en {a} y {b}.", pt: "Forte compatibilidade em {a} e {b}.", it: "Forte compatibilità in {a} e {b}.", fr: "Forte compatibilité en {a} et {b}.", sq: "Përputhje e fortë në {a} dhe {b}." },
  "match.strongCompatibilityInOne": { es: "Fuerte compatibilidad en {a}.", pt: "Forte compatibilidade em {a}.", it: "Forte compatibilità in {a}.", fr: "Forte compatibilité en {a}.", sq: "Përputhje e fortë në {a}." },
  "People, places and experiences that fit you. Discover matches, explore the catalog, and connect with Zyra.": {
    es: "Personas, lugares y experiencias que encajan contigo. Descubre matches, explora el catálogo y conecta con Zyra.",
    pt: "Pessoas, lugares e experiências que combinam contigo. Descobre matches, explora o catálogo e conecta com a Zyra.",
    it: "Persone, luoghi ed esperienze che fanno per te. Scopri i match, esplora il catalogo e connettiti con Zyra.",
    fr: "Des personnes, lieux et expériences qui te correspondent. Découvre les matchs, explore le catalogue et connecte-toi avec Zyra.",
    sq: "Njerëz, vende dhe përvoja që të përshtaten. Zbulo përputhjet, eksploro katalogun dhe lidhu me Zyra.",
  },
  "People, places and experiences that fit you. Discover matches, explore the catalog, and connect. Create your free account.": {
    es: "Personas, lugares y experiencias que encajan contigo. Descubre matches, explora el catálogo y conecta. Crea tu cuenta gratis.",
    pt: "Pessoas, lugares e experiências que combinam contigo. Descobre matches, explora o catálogo e conecta. Cria a tua conta grátis.",
    it: "Persone, luoghi ed esperienze che fanno per te. Scopri i match, esplora il catalogo e connettiti. Crea il tuo account gratuito.",
    fr: "Des personnes, lieux et expériences qui te correspondent. Découvre les matchs, explore le catalogue et connecte-toi. Crée ton compte gratuit.",
    sq: "Njerëz, vende dhe përvoja që të përshtaten. Zbulo përputhjet, eksploro katalogun dhe lidhu. Krijo llogarinë tënde falas.",
  },
  "Recent searches": { es: "Búsquedas recientes", pt: "Pesquisas recentes", it: "Ricerche recenti", fr: "Recherches récentes", sq: "Kërkimet e fundit" },
  "Search experiences": { es: "Buscar experiencias", pt: "Pesquisar experiências", it: "Cerca esperienze", fr: "Rechercher des expériences", sq: "Kërko përvoja" },
  "Search places": { es: "Buscar lugares", pt: "Pesquisar lugares", it: "Cerca luoghi", fr: "Rechercher des lieux", sq: "Kërko vende" },
  "Name or address...": { es: "Nombre o dirección...", pt: "Nome ou morada...", it: "Nome o indirizzo...", fr: "Nom ou adresse...", sq: "Emër ose adresë..." },
  "Min. rating": { es: "Valoración mín.", pt: "Classificação mín.", it: "Valutazione min.", fr: "Note min.", sq: "Vlerësimi min." },
  "Any rating": { es: "Cualquier valoración", pt: "Qualquer classificação", it: "Qualsiasi valutazione", fr: "Toute note", sq: "Çdo vlerësim" },
  "3+ rating": { es: "Valoración 3+", pt: "Classificação 3+", it: "Valutazione 3+", fr: "Note 3+", sq: "Vlerësim 3+" },
  "4+ rating": { es: "Valoración 4+", pt: "Classificação 4+", it: "Valutazione 4+", fr: "Note 4+", sq: "Vlerësim 4+" },
  "Share profile": { es: "Compartir perfil", pt: "Partilhar perfil", it: "Condividi profilo", fr: "Partager le profil", sq: "Ndaj profilin" },
  "Profile on Syncro": { es: "Perfil en Syncro", pt: "Perfil no Syncro", it: "Profilo su Syncro", fr: "Profil sur Syncro", sq: "Profili në Syncro" },
  "Someone shared Syncro with you": { es: "Alguien te ha compartido Syncro", pt: "Alguém partilhou o Syncro contigo", it: "Qualcuno ha condiviso Syncro con te", fr: "Quelqu'un a partagé Syncro avec toi", sq: "Dikush ndau Syncro me ty" },
  "Curated activities.": { es: "Actividades seleccionadas.", pt: "Atividades selecionadas.", it: "Attività selezionate.", fr: "Activités sélectionnées.", sq: "Aktivitetet e zgjedhura." },
  "Unread notifications: {count}": { es: "Notificaciones sin leer: {count}", pt: "Notificações por ler: {count}", it: "Notifiche non lette: {count}", fr: "Notifications non lues : {count}", sq: "Njoftimet e palexuara: {count}" },
  "Mark all as read": { es: "Marcar todas como leídas", pt: "Marcar todas como lidas", it: "Segna tutte come lette", fr: "Tout marquer comme lu", sq: "Shëno të gjitha si të lexuara" },
  "Loading notifications...": { es: "Cargando notificaciones...", pt: "A carregar notificações...", it: "Caricamento notifiche...", fr: "Chargement des notifications...", sq: "Duke ngarkuar njoftimet..." },
  "No notifications yet": { es: "Aún no hay notificaciones", pt: "Ainda sem notificações", it: "Nessuna notifica ancora", fr: "Pas encore de notifications", sq: "Ende pa njoftime" },
  "Open the app to see details.": { es: "Abre la app para ver los detalles.", pt: "Abre a app para ver os detalhes.", it: "Apri l'app per vedere i dettagli.", fr: "Ouvre l'app pour voir les détails.", sq: "Hap aplikacionin për të parë detajet." },
  "Mark as read": { es: "Marcar como leída", pt: "Marcar como lida", it: "Segna come letta", fr: "Marquer comme lu", sq: "Shëno si të lexuar" },
  "Unread": { es: "Sin leer", pt: "Por ler", it: "Non letto", fr: "Non lu", sq: "E palexuar" },
  "Open detail": { es: "Abrir detalle", pt: "Abrir detalhe", it: "Apri dettaglio", fr: "Ouvrir le détail", sq: "Hap detajin" },
};

const locales = ["es", "pt", "it", "fr", "sq"];
for (const loc of locales) {
  const filePath = path.join(messagesDir, `phrases.${loc}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let added = 0;
  for (const key of enKeys) {
    if (key in data) continue;
    const val = translations[key] && translations[key][loc] ? translations[key][loc] : en[key];
    data[key] = val;
    added++;
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${loc}: added ${added} keys`);
}

console.log("Done.");
