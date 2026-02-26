import { DailyExamLimitResponse } from '../types';

const LEDGER_KEY = 'exam:daily-question-ledger:v1';

type SessionUsageMap = Record<string, number>;
type CourseUsageMap = Record<string, SessionUsageMap>;
type UserUsageMap = Record<string, CourseUsageMap>;
type DailyLedger = Record<string, UserUsageMap>;
const GLOBAL_LEDGER_USER_KEY = '__global__';

const getTodayKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const decodeUserIdFromAccessToken = (): string => {
  try {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      '';
    if (!token) return 'anonymous';

    const parts = token.split('.');
    if (parts.length !== 3) return 'anonymous';

    const payloadPart = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const paddedPayload = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
    const payload = JSON.parse(atob(paddedPayload));
    const userId = String(payload?.userId || payload?.sub || payload?.id || '').trim();
    return userId || 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const readLedger = (): DailyLedger => {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeLedger = (ledger: DailyLedger) => {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
};

const pruneLedger = (ledger: DailyLedger): DailyLedger => {
  const today = getTodayKey();
  return Object.keys(ledger).reduce<DailyLedger>((next, key) => {
    if (key === today) {
      next[key] = ledger[key];
    }
    return next;
  }, {});
};

export const recordStartedExamConsumption = (
  courseId: string,
  examSessionId: string,
  questionsAllocated: number
) => {
  if (!courseId || !examSessionId) return;

  const safeAllocated = Math.max(0, Number(questionsAllocated) || 0);
  if (safeAllocated <= 0) return;

  const dayKey = getTodayKey();
  const userId = decodeUserIdFromAccessToken();
  const ledger = pruneLedger(readLedger());

  const userMap = (ledger[dayKey] ||= {});
  const recordForUser = (bucketUserId: string) => {
    const courseMap = (userMap[bucketUserId] ||= {});
    const sessionUsage = (courseMap[courseId] ||= {});

    if (!sessionUsage[examSessionId]) {
      sessionUsage[examSessionId] = safeAllocated;
    }
  };

  recordForUser(userId || 'anonymous');
  recordForUser(GLOBAL_LEDGER_USER_KEY);

  writeLedger(ledger);
};

const getLocallyConsumedToday = (courseId: string): number => {
  const dayKey = getTodayKey();
  const userId = decodeUserIdFromAccessToken();
  const ledger = readLedger();

  const sumBucket = (bucketUserId: string): number => {
    const sessions = ledger?.[dayKey]?.[bucketUserId]?.[courseId];
    if (!sessions || typeof sessions !== 'object') {
      return 0;
    }
    return Object.values(sessions).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  return Math.max(sumBucket(userId || 'anonymous'), sumBucket(GLOBAL_LEDGER_USER_KEY));
};

export const applyLocalConsumptionToDailyLimit = (
  limit: DailyExamLimitResponse,
  courseId: string
): DailyExamLimitResponse => {
  const localConsumed = getLocallyConsumedToday(courseId);
  if (localConsumed <= 0) {
    return limit;
  }

  const safeDailyLimit = Math.max(0, Number(limit.dailyLimit) || 0);
  const safeUsedToday = Math.max(0, Number(limit.usedToday) || 0);
  const safeRemaining = Math.max(0, Number(limit.remainingToday) || 0);

  const adjustedUsedToday = Math.max(safeUsedToday, localConsumed);
  const computedRemaining = safeDailyLimit > 0
    ? Math.max(0, safeDailyLimit - adjustedUsedToday)
    : safeRemaining;

  const adjustedRemaining = Math.min(safeRemaining, computedRemaining);

  return {
    ...limit,
    usedToday: adjustedUsedToday,
    remainingToday: adjustedRemaining,
    courseId: limit.courseId || courseId,
  };
};
