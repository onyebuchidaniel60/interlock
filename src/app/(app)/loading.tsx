export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading page">
      <div className="h-28 animate-pulse rounded-2xl border border-line bg-white/[0.025]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-line bg-white/[0.02]"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-line bg-white/[0.02]" />
    </div>
  );
}
