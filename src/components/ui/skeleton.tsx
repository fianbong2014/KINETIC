import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder block. Use for loading states where the final
 * content has a known shape.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-container-high animate-pulse",
        className
      )}
      {...props}
    />
  );
}
