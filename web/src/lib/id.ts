/**
 * Generate a short opaque ID. Uses crypto.randomUUID where available,
 * falls back to a Math.random base36 string for very old runtimes.
 */
export function makeId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}
