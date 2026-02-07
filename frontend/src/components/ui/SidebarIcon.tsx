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
  home: "/icons/home.png",
  people: "/icons/people.png",
  places: "/icons/places.png",
  moments: "/icons/moments.png",
  insights: "/icons/insights.png",
  chat: "/icons/chat.png",
  profile: "/icons/profile.png",
  settings: "/icons/settings.png",
  support: "/icons/support.png",
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
