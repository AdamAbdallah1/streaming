import { cn } from "../../lib/cn";

export function Spinner({ className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

export function Skeleton({ className }) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse rounded-[var(--radius-md)] bg-muted", className)} />
  );
}

export function ServiceRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-hairline px-4 py-4 last:border-0">
      <Skeleton className="size-10 rounded-[var(--radius-md)]" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-5">
      <Skeleton className="h-4 w-28" />
      <div className="mt-5 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-5 h-12 w-full rounded-[var(--radius-lg)]" />
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-row overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface sm:flex-col"
        >
          <Skeleton className="h-[86px] w-[86px] rounded-none sm:h-[104px] sm:w-full" />
          <div className="flex-1 space-y-2 p-3.5 sm:p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
