/**
 * Plan Tier Restrictions
 * Defines what features and limits are available for each plan tier
 * Based on backend specification
 */

export type PlanTier = 'free' | 'basic' | 'premium';

const normalizePlanTier = (plan?: string, role?: string): PlanTier => {
  const tier = String(plan || '').toLowerCase();
  if (tier === 'free' || tier === 'basic' || tier === 'premium') return tier;
  if (String(role || '').toLowerCase() === 'admin') return 'premium';
  return 'free';
};

export interface PlanRestrictions {
  plan: PlanTier;
  maxQuestionsPerExam: number;
  canCustomizeQuestionCount: boolean;
  canAccessAnalytics: boolean;
  canAccessStudyMaterials: boolean;
  canAccessLeaderboard: boolean;
  examsPerMonth: number;
  canGenerateAIQuestions: boolean;
  canAccessStudyPlans: boolean;
  canDownloadReports: boolean;
  accessibleDifficultyLevels: string[];
  supportsPromoCode: boolean;
}

export const PLAN_RESTRICTIONS: Record<PlanTier, PlanRestrictions> = {
  free: {
    plan: 'free',
    maxQuestionsPerExam: 40,
    canCustomizeQuestionCount: false,
    canAccessAnalytics: true,
    canAccessStudyMaterials: true,
    canAccessLeaderboard: true,
    examsPerMonth: 10,
    canGenerateAIQuestions: false,
    canAccessStudyPlans: false,
    canDownloadReports: false,
    accessibleDifficultyLevels: ['easy', 'medium', 'hard'],
    supportsPromoCode: false,
  },
  basic: {
    plan: 'basic',
    maxQuestionsPerExam: 70,
    canCustomizeQuestionCount: true,
    canAccessAnalytics: true,
    canAccessStudyMaterials: true,
    canAccessLeaderboard: true,
    examsPerMonth: 50,
    canGenerateAIQuestions: false,
    canAccessStudyPlans: true,
    canDownloadReports: true,
    accessibleDifficultyLevels: ['easy', 'medium', 'hard'],
    supportsPromoCode: true,
  },
  premium: {
    plan: 'premium',
    maxQuestionsPerExam: 70,
    canCustomizeQuestionCount: true,
    canAccessAnalytics: true,
    canAccessStudyMaterials: true,
    canAccessLeaderboard: true,
    examsPerMonth: 100,
    canGenerateAIQuestions: true,
    canAccessStudyPlans: true,
    canDownloadReports: true,
    accessibleDifficultyLevels: ['easy', 'medium', 'hard'],
    supportsPromoCode: true,
  },
};

/**
 * Get plan restrictions for a given plan tier
 */
export function getPlanRestrictions(plan?: string, role?: string): PlanRestrictions {
  const tier = normalizePlanTier(plan, role);
  return PLAN_RESTRICTIONS[tier];
}

/**
 * Check if user can access a specific feature
 */
export function canAccessFeature(
  userPlan: string | undefined,
  userRole: string | undefined,
  feature: keyof Omit<PlanRestrictions, 'plan' | 'accessibleDifficultyLevels'>
): boolean {
  const restrictions = getPlanRestrictions(userPlan, userRole);
  return restrictions[feature] as boolean;
}

/**
 * Get max questions allowed for a plan
 */
export function getMaxQuestionsForPlan(userPlan: string | undefined, userRole?: string): number {
  return getPlanRestrictions(userPlan, userRole).maxQuestionsPerExam;
}

/**
 * Check if user can customize question count
 */
export function canCustomizeQuestionCount(userPlan: string | undefined, userRole?: string): boolean {
  return getPlanRestrictions(userPlan, userRole).canCustomizeQuestionCount;
}

/**
 * Get accessible difficulty levels for a plan
 */
export function getAccessibleLevels(userPlan: string | undefined, userRole?: string): string[] {
  return getPlanRestrictions(userPlan, userRole).accessibleDifficultyLevels;
}

/**
 * Check if difficulty level is accessible for user plan
 */
export function isDifficultyLevelAccessible(
  userPlan: string | undefined,
  userRole: string | undefined,
  level: string
): boolean {
  const levels = getAccessibleLevels(userPlan, userRole);
  return levels.includes(level.toLowerCase());
}

/**
 * Get restriction message for user
 */
export function getRestrictionMessage(
  userPlan: string | undefined,
  userRole: string | undefined,
  feature: string
): string {
  const restrictions = getPlanRestrictions(userPlan, userRole);
  const messages: Record<string, string> = {
    maxQuestionsPerExam: `Your ${restrictions.plan} plan is limited to ${restrictions.maxQuestionsPerExam} questions per exam.`,
    canCustomizeQuestionCount: 'Question customization is only available for Basic and Premium plans.',
    canGenerateAIQuestions: 'AI question generation is only available for Premium plan.',
    canAccessStudyPlans: 'Study plans are only available for Basic and Premium plans.',
    canDownloadReports: 'Report downloads are only available for Basic and Premium plans.',
  };
  return messages[feature] || `This feature is not available for your ${restrictions.plan} plan.`;
}

/**
 * Format plan name for display
 */
export function formatPlanName(plan?: string): string {
  if (!plan) return 'Free';
  const tier = plan.toLowerCase();
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Get plan color for UI display
 */
export function getPlanColor(plan?: string): string {
  const tier = (plan?.toLowerCase() as PlanTier) || 'free';
  const colors: Record<PlanTier, string> = {
    free: 'gray',
    basic: 'blue',
    premium: 'purple',
  };
  return colors[tier];
}
