import { useCallback, useEffect, useState } from 'react';
import { parseCooldownSeconds, readStoredCooldown, writeStoredCooldown } from '../lib/cooldown';

interface UseCooldownTimerOptions {
  initialSeconds?: unknown;
  storageKey?: string;
}

export const useCooldownTimer = ({ initialSeconds, storageKey }: UseCooldownTimerOptions) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const provided = parseCooldownSeconds(initialSeconds);
    if (provided !== undefined) return provided;
    return readStoredCooldown(storageKey) ?? 0;
  });

  const [isCooldownKnown, setCooldownKnown] = useState<boolean>(() => {
    const provided = parseCooldownSeconds(initialSeconds);
    if (provided !== undefined) return true;
    return readStoredCooldown(storageKey) !== undefined;
  });

  useEffect(() => {
    const provided = parseCooldownSeconds(initialSeconds);
    if (provided !== undefined) {
      setSecondsRemaining(provided);
      setCooldownKnown(true);
      return;
    }

    const stored = readStoredCooldown(storageKey);
    if (stored !== undefined) {
      setSecondsRemaining(stored);
      setCooldownKnown(true);
      return;
    }

    setSecondsRemaining(0);
    setCooldownKnown(false);
  }, [initialSeconds, storageKey]);

  useEffect(() => {
    writeStoredCooldown(storageKey, secondsRemaining);
  }, [secondsRemaining, storageKey]);

  useEffect(() => {
    if (secondsRemaining <= 0) return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) return 0;
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [secondsRemaining]);

  const setCooldownFromServer = useCallback((value: unknown): number | undefined => {
    const parsed = parseCooldownSeconds(value);
    if (parsed === undefined) return undefined;
    setSecondsRemaining(parsed);
    setCooldownKnown(true);
    return parsed;
  }, []);

  return {
    secondsRemaining,
    isCooldownKnown,
    setSecondsRemaining,
    setCooldownKnown,
    setCooldownFromServer,
  };
};
