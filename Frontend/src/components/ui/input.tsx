import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          [
            "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-base text-foreground shadow-xs",
            "transition-[border-color,box-shadow] duration-150 ease-out",
            "placeholder:text-muted-foreground/70",
            "hover:border-border-strong",
            // Anel de foco no lugar do outline global: o campo inteiro reage.
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
            "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "md:text-sm",
          ].join(" "),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
