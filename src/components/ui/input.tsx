import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-xl border border-ink/15 bg-white px-4 py-2 text-base text-ink placeholder:text-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
