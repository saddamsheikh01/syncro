import Image from "next/image";
import { cx } from "@/lib/classNames";

export interface AuthDesktopVisualProps {
  className?: string;
  alt?: string;
}

export const AuthDesktopVisual = ({
  className,
  alt = "Syncro welcome visual",
}: AuthDesktopVisualProps) => (
  <div
    className={cx(
      "hidden w-full max-w-[560px] lg:flex lg:items-center lg:justify-center",
      className,
    )}
  >
    <Image
      src="/AI/login.png"
      alt={alt}
      width={900}
      height={1100}
      priority
      className="h-auto w-full max-h-[780px] object-contain"
    />
  </div>
);
