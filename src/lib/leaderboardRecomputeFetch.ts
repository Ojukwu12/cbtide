export interface LeaderboardRecomputeResult {
  success: boolean;
  message?: string;
}

export async function recomputeLeaderboardWithFetch(accessToken: string): Promise<LeaderboardRecomputeResult> {
  const response = await fetch('/api/leaderboards/admin/recompute', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = String(payload?.message || payload?.error?.message || 'Failed to recompute leaderboard');
    throw new Error(message);
  }

  return {
    success: payload?.success !== undefined ? Boolean(payload.success) : true,
    message: payload?.message ? String(payload.message) : undefined,
  };
}
