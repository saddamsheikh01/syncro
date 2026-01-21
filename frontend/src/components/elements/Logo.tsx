import Image from "next/image";
import type { ImageProps } from "next/image";
import { cx } from "@/lib/classNames";

const DEFAULT_WIDTH = 180;
const ASPECT_RATIO = 1104 / 624;

export interface LogoProps
  extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

const resolveSize = (width?: number, height?: number) => {
  if (width && height) return { width, height };
  if (width) return { width, height: Math.round(width / ASPECT_RATIO) };
  if (height) return { width: Math.round(height * ASPECT_RATIO), height };
  return {
    width: DEFAULT_WIDTH,
    height: Math.round(DEFAULT_WIDTH / ASPECT_RATIO),
  };
};

export const Logo = ({
  className,
  width,
  height,
  alt = "Syncro",
  ...props
}: LogoProps) => {
  const size = resolveSize(width, height);

  return (
    <Image
      src="/logo.svg"
      alt={alt}
      width={size.width}
      height={size.height}
      className={cx("h-auto w-auto", className)}
      {...props}
    />
  );
};
