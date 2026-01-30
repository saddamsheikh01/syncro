export type TutorialStepIcon = "setup" | "tests";

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
    title: "Completa il tuo profilo",
    description:
      "Aggiungi le tue passioni e le informazioni chiave: bastano pochi minuti per rendere il profilo davvero utile.",
    highlight: "Vai su Impostazioni e completa il profilo.",
  },
  {
    id: "tests",
    icon: "tests",
    title: "Inizia i test",
    description:
      "I micro‑test migliorano i match e aiutano Zyra a capire meglio chi sei.",
    highlight: "Ti consigliamo di iniziare dai primi test disponibili.",
  },
];
