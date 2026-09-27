export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-page/90 px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 animate-pulse rounded-xl bg-surface" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 animate-pulse rounded bg-surface" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-surface" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 animate-pulse rounded-xl bg-surface" />
          <div className="h-8 w-8 animate-pulse rounded-xl bg-surface" />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 py-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl bg-surface"
            style={{ animationDelay: `${i * 75}ms` }}
          />
        ))}
      </div>
    </>
  );
}
