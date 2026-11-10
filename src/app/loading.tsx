export default function RootLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-6">
      <div className="w-full max-w-sm" aria-busy="true" aria-label="Loading Interlock">
        <div className="h-2 w-24 animate-pulse rounded-full bg-accent/40" />
        <div className="mt-5 h-28 animate-pulse rounded-2xl border border-line bg-panel" />
      </div>
    </div>
  );
}
