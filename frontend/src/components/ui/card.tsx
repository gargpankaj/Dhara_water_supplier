import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("panel p-5", className)}>{children}</div>;
}

