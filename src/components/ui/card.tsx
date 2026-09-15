import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-shadow rounded-3xl border border-border bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  icon: Icon,
  iconBg = "bg-primary-soft",
  iconColor = "text-primary",
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 pt-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl",
              iconBg
            )}
          >
            <Icon className={cn("size-[18px]", iconColor)} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground whitespace-nowrap">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
