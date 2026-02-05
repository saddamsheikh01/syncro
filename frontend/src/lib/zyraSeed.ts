export const ZYRA_SEED_STORAGE_KEY = "syncro.zyra.seed";

export const storeZyraSeedMessage = (message: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ZYRA_SEED_STORAGE_KEY, message);
};

export const readZyraSeedMessage = () => {
  if (typeof window === "undefined") return null;
  const message = sessionStorage.getItem(ZYRA_SEED_STORAGE_KEY);
  if (message) {
    sessionStorage.removeItem(ZYRA_SEED_STORAGE_KEY);
    return message;
  }
  return null;
};
