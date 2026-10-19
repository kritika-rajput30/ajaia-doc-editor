import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-blue-50 text-blue-700 border border-blue-200/60",
        secondary:
          "bg-slate-100 text-slate-700 border border-slate-200/60",
        destructive:
          "bg-rose-50 text-rose-700 border border-rose-200/60",
        success:
          "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
        warning:
          "bg-amber-50 text-amber-700 border border-amber-200/60",
        outline: "text-slate-700 border border-slate-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
