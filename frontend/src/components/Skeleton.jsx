export function Skeleton({ width = '100%', height = 16, radius }) {
  return <span className="skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius }} />;
}

/** Placeholder shaped like an event card. */
export function CardSkeleton() {
  return (
    <div className="card stack" role="status" aria-label="Loading">
      <Skeleton width="40%" height={22} radius={999} />
      <Skeleton height={24} />
      <Skeleton width="70%" />
      <Skeleton width="55%" />
      <Skeleton height={10} radius={999} />
      <Skeleton height={44} radius={999} />
    </div>
  );
}

export default Skeleton;

