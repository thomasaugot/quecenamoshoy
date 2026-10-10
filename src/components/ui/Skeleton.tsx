// A grey stand-in shape, shown only if loading lasts over 250 ms. Size and shape come from the caller's classes, so a skeleton is drawn
// with the same layout classes as the real thing — and cannot drift from it unnoticed.
export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div aria-hidden="true" className={`skeleton-delayed rounded-md bg-surface-2 ${className}`} />
)
