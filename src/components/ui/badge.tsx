"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-bold backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
