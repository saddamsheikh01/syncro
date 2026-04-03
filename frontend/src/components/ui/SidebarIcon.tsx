import Image from "next/image";
import type { ImageProps } from "next/image";
import { cx } from "@/lib/classNames";

export type SidebarIconName =
  | "home"
  | "people"
  | "places"
  | "moments"
  | "insights"
  | "chat"
  | "profile"
  | "settings"
  | "support"
  | "zyra"
  | "activation"
  | "expats-kit"
  | "budget-simulator"
  | "subscriptions"
  | "expats";

const ICONS: Record<SidebarIconName, string> = {
  home: "/icons/new-icons/home.svg",
  people: "/icons/new-icons/people.svg",
  places: "/icons/new-icons/palces.svg",
  moments: "/icons/new-icons/moments.png",
  insights: "/icons/svg/insights.svg",
  chat: "/icons/new-icons/chat.png",
  profile: "/icons/new-icons/profile.png",
  settings: "/icons/new-icons/settings.png",
  support: "/icons/new-icons/support.png",
  zyra: "/icons/new-icons/zyr.png",
  activation: "/icons/new-icons/activation.png",
  "expats-kit": "/icons/new-icons/expats-kit.png",
  "budget-simulator": "/icons/new-icons/budget-simulator.png",
  subscriptions: "/icons/new-icons/subscritions.png",
  expats: "/icons/new-icons/expats.png",
};

export interface SidebarIconProps
  extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  name: SidebarIconName;
  size?: number;
  alt?: string;
}

export const SidebarIcon = ({
  name,
  size = 32,
  alt,
  className,
  ...props
}: SidebarIconProps) => (
  <Image
    src={ICONS[name]}
    alt={alt ?? name}
    width={size}
    height={size}
    className={cx("h-auto w-auto", className)}
    {...props}
  />
);
