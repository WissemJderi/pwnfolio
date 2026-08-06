export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div
    className={`animate-pulse rounded-sm border border-line-800 bg-core-700/50 ${className}`}
    aria-hidden="true"
  />
);

export const CardSkeleton = () => (
  <div className="panel flex h-full flex-col gap-3 p-4">
    <div className="flex items-center gap-1.5">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-12" />
      <Skeleton className="ml-auto h-5 w-14" />
    </div>
    <Skeleton className="mt-2 h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="mt-auto flex items-center justify-between border-t border-line-800 pt-2.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

export const GridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="mt-6 grid gap-4 sm:grid-cols-2">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

export const SectionSkeleton = () => (
  <div>
    <Skeleton className="h-5 w-44" />
    <div className="mt-3 space-y-2">
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
  </div>
);

export const RowSkeleton = () => (
  <li className="panel flex items-center gap-4 p-4">
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-5 w-16" />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-16" />
    </div>
  </li>
);

export const FormSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="h-8 w-32" />
    </div>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="panel space-y-2 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    ))}
    <div className="flex gap-2">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-28" />
    </div>
  </div>
);