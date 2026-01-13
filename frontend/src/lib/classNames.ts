type ClassValue = string | null | undefined | false;

export const cx = (...classes: ClassValue[]) =>
  classes.filter(Boolean).join(" ");
