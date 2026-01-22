export type TutorialStepIcon =
  | "setup"
  | "welcome"
  | "home"
  | "map"
  | "match"
  | "feed"
  | "chat"
  | "tests"
  | "profile";

export type TutorialStep = {
  id: string;
  icon: TutorialStepIcon;
  title: string;
  description: string;
  highlight?: string;
};

export const tutorialSteps: TutorialStep[] = [
  {
    id: "setup",
    icon: "setup",
    title: "Completa il tuo Profilo",
    description:
      "Per ottenere il massimo da Syncro, completa il tuo profilo nelle Impostazioni. Aggiungi i tuoi interessi, imposta le preferenze di match e attiva la posizione.",
    highlight:
      "Un profilo completo ti permette di ricevere match piu accurati e suggerimenti personalizzati. Vai su Impostazioni per completarlo!",
  },
  {
    id: "welcome",
    icon: "welcome",
    title: "Benvenuto su Syncro",
    description:
      "Syncro ti aiuta a connetterti con persone affini, scoprire luoghi ed esperienze su misura per te. Lascia che ti guidiamo attraverso le funzionalita principali.",
  },
  {
    id: "home",
    icon: "home",
    title: "La tua Home",
    description:
      "Qui trovi suggerimenti personalizzati, match del giorno e accesso rapido a tutte le sezioni. Tutto basato sul tuo profilo e i tuoi interessi.",
  },
  {
    id: "map",
    icon: "map",
    title: "Esplora la Mappa",
    description:
      "Scopri luoghi ed esperienze vicino a te. Attiva la posizione per vedere suggerimenti basati sulla tua area geografica.",
  },
  {
    id: "match",
    icon: "match",
    title: "I tuoi Match",
    description:
      "Trova persone con interessi simili ai tuoi. L'affinita viene calcolata in base al profilo, interessi condivisi e risultati dei test.",
  },
  {
    id: "feed",
    icon: "feed",
    title: "Feed della Community",
    description:
      "Scopri cosa succede intorno a te. Post, foto e aggiornamenti dalle persone nelle vicinanze.",
  },
  {
    id: "chat",
    icon: "chat",
    title: "Chat e Messaggi",
    description:
      "Inizia conversazioni con i tuoi match. Scambia messaggi e organizza incontri in modo semplice.",
  },
  {
    id: "tests",
    icon: "tests",
    title: "Test di Personalita",
    description:
      "Completa i test per migliorare i tuoi match. Piu test completi, piu accurate saranno le affinita calcolate con gli altri utenti.",
    highlight:
      "I test sono fondamentali per ottenere match di qualita. Ti consigliamo di completarli tutti.",
  },
  {
    id: "profile",
    icon: "profile",
    title: "Il tuo Profilo",
    description:
      "Personalizza il tuo profilo, gestisci le preferenze e controlla la visibilita. Un profilo completo attira piu match.",
  },
];
