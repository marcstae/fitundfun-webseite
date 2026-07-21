import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base text-ink placeholder:text-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
