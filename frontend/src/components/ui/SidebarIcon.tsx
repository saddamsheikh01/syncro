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
  | "zyra";

const ICONS: Record<SidebarIconName, string> = {
  home: "/icons/svg/home.svg",
  people: "/icons/svg/people.svg",
  places: "/icons/svg/places.svg",
  moments: "/icons/svg/moments.svg",
  insights: "/icons/svg/insights.svg",
  chat: "/icons/svg/chat.svg",
  profile: "/icons/svg/profile.svg",
  settings: "/icons/svg/settings.svg",
  support: "/icons/svg/support.svg",
  zyra: "/AI/zyra.png",
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
