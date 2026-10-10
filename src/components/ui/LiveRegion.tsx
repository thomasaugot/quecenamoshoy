// Singleton, mounted once in Providers. Written to by utils/announce.
export const LiveRegion = () => (
  <>
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" id="live-polite" />
    <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only" id="live-assertive" />
  </>
)
