export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-3 w-20 bg-teal/10 rounded-full mb-2" />
        <div className="h-8 w-48 bg-surface rounded-xl" />
      </div>
      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface border border-teal/8 rounded-2xl p-4 h-24" />
        ))}
      </div>
      {/* Content skeleton */}
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="bg-surface border border-teal/8 rounded-xl h-16" />
      ))}
    </div>
  )
}
