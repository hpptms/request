// setInterval that idles while the tab is hidden and catches up with one
// immediate call when it becomes visible again, so background tabs stop
// polling the API. Returns a cleanup function.
export function visibleInterval(fn: () => void, ms: number): () => void {
  const id = setInterval(() => {
    if (!document.hidden) fn();
  }, ms);
  const onVisible = () => {
    if (!document.hidden) fn();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
