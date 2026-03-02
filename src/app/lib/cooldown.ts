export const parseCooldownSeconds = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.floor(parsed);
};

export const formatCooldownCountdown = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const readStoredCooldown = (storageKey?: string): number | undefined => {
  if (typeof window === 'undefined' || !storageKey) return undefined;
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as { remainingSeconds?: number; capturedAt?: number };
    const remaining = parseCooldownSeconds(parsed?.remainingSeconds);
    if (remaining === undefined) return undefined;

    const capturedAt = Number(parsed?.capturedAt || Date.now());
    const elapsed = Math.max(0, Math.floor((Date.now() - capturedAt) / 1000));
    return Math.max(0, remaining - elapsed);
  } catch {
    return undefined;
  }
};

export const writeStoredCooldown = (storageKey: string | undefined, remainingSeconds: number) => {
  if (typeof window === 'undefined' || !storageKey) return;

  sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      remainingSeconds: Math.max(0, Math.floor(remainingSeconds)),
      capturedAt: Date.now(),
    })
  );
};
