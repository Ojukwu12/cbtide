export const parseCooldownSeconds = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const direct = Number(trimmed);
    if (Number.isFinite(direct) && direct >= 0) {
      return Math.floor(direct);
    }

    const numericMatch = trimmed.match(/\d+(\.\d+)?/);
    if (numericMatch) {
      const parsedFromString = Number(numericMatch[0]);
      if (Number.isFinite(parsedFromString) && parsedFromString >= 0) {
        return Math.floor(parsedFromString);
      }
    }

    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.floor(parsed);
};

const isObjectRecord = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const mergeResponseLayers = (payload: unknown): Record<string, any> => {
  if (!isObjectRecord(payload)) {
    return {};
  }

  const layers: Record<string, any>[] = [];
  const queue: unknown[] = [payload];
  const visited = new Set<unknown>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!isObjectRecord(current) || visited.has(current)) {
      continue;
    }

    visited.add(current);
    layers.push(current);

    queue.push(current.data, current.result, current.details);
  }

  return layers.reduce<Record<string, any>>((accumulator, layer) => ({
    ...accumulator,
    ...layer,
  }), {});
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

export const extractRetryAfterSeconds = (headers: any): number | undefined => {
  if (!headers) return undefined;

  const retryAfter =
    headers?.['retry-after'] ??
    headers?.['Retry-After'] ??
    headers?.retryAfter ??
    headers?.retry_after;

  return parseCooldownSeconds(retryAfter);
};

export const extractResetCooldownSeconds = (payload: any, headers?: any): number | undefined => {
  const combined = mergeResponseLayers(payload);

  const candidates = [
    combined?.resetEmailCooldownSeconds,
    combined?.cooldownSeconds,
    combined?.retryAfter,
    combined?.retryAfterSeconds,
  ];

  for (const candidate of candidates) {
    const parsed = parseCooldownSeconds(candidate);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return extractRetryAfterSeconds(headers);
};
