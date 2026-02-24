import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { Loader, BookOpen, ChevronLeft, ArrowRight, AlertCircle } from 'lucide-react';
import { Topic, DailyExamLimitResponse } from '../../../types';
import { examService } from '../../../lib/services/exam.service';
import { academicService } from '../../../lib/services/academic.service';
import { Button } from '../ui/button';
import { UniversitySelector } from './UniversitySelector';
import { DepartmentSelector } from './DepartmentSelector';
import { CourseSelector } from './CourseSelector';
import {
  getMaxQuestionsForPlan,
  canCustomizeQuestionCount,
  getAccessibleLevels,
  getRestrictionMessage,
} from '../../../lib/planRestrictions';

type WizardStep = 'university' | 'department' | 'course' | 'config';

interface WizardState {
  universityId: string;
  departmentId: string;
  courseId: string;
  examType: 'practice' | 'mock' | 'final';
  totalQuestions: number;
  durationMinutes: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  topicIds: string[];
}

export function ExamStartWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>(() => {
    return user?.lastSelectedUniversityId ? 'department' : 'university';
  });

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingDailyLimit, setLoadingDailyLimit] = useState(false);
  const [dailyLimit, setDailyLimit] = useState<DailyExamLimitResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Determine question count constraints based on user tier from plan restrictions
  const maxQuestions = getMaxQuestionsForPlan(user?.plan, user?.role);
  const canCustomize = canCustomizeQuestionCount(user?.plan, user?.role);
  const defaultQuestions = canCustomize ? Math.min(20, maxQuestions) : maxQuestions;
  const accessibleLevels = getAccessibleLevels(user?.plan, user?.role);
  const remainingToday = dailyLimit?.remainingToday;
  const effectiveMaxQuestions = typeof remainingToday === 'number'
    ? Math.max(0, Math.min(maxQuestions, remainingToday))
    : maxQuestions;

  const [wizard, setWizard] = useState<WizardState>({
    universityId: user?.lastSelectedUniversityId || '',
    departmentId: user?.lastSelectedDepartmentId || '',
    courseId: user?.lastSelectedCourseId || '',
    examType: 'practice',
    totalQuestions: defaultQuestions,
    durationMinutes: 30,
    topicIds: [],
  });
  const getTopicId = (topic: any): string => topic?.id || topic?._id || '';

  // Load topics when course changes
  useEffect(() => {
    const loadTopics = async () => {
      if (!wizard.courseId) {
        setTopics([]);
        return;
      }

      try {
        setLoadingTopics(true);
        const data = await academicService.getTopics(wizard.courseId);
        const scopedTopics = (data || []).filter((topic: any) => {
          const topicCourseId = String(topic?.courseId || topic?.course?._id || topic?.course?.id || wizard.courseId || '');
          return topicCourseId === wizard.courseId;
        });
        setTopics(scopedTopics.sort((a, b) => (a.order || 0) - (b.order || 0)));
        setWizard((prev) => ({ ...prev, topicIds: [] }));
      } catch (err) {
        setTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    };

    loadTopics();
  }, [wizard.courseId]);

  useEffect(() => {
    const loadDailyLimit = async () => {
      if (!wizard.courseId) {
        setDailyLimit(null);
        return;
      }

      try {
        setLoadingDailyLimit(true);
        const limitInfo = await examService.getDailyLimit(wizard.courseId);
        console.log('[ExamStartWizard] Daily limit fetched:', limitInfo);
        setDailyLimit(limitInfo);
      } catch (error) {
        console.error('[ExamStartWizard] Failed to fetch daily limit:', error);
        const userPlan = (user?.plan || 'free').toLowerCase();
        const planDefaults: Record<string, number> = {
          free: 40,
          basic: 70,
          premium: 70,
        };
        const defaultLimit = planDefaults[userPlan] || 40;
        setDailyLimit({
          plan: userPlan as any,
          dailyLimit: defaultLimit,
          usedToday: 0,
          remainingToday: defaultLimit,
          courseId: wizard.courseId,
        });
      } finally {
        setLoadingDailyLimit(false);
      }
    };

    loadDailyLimit();
  }, [wizard.courseId, user?.plan]);

  useEffect(() => {
    setWizard((prev) => {
      const nextTotalQuestions = canCustomize
        ? Math.max(1, Math.min(prev.totalQuestions, Math.max(1, effectiveMaxQuestions)))
        : Math.max(1, effectiveMaxQuestions);
      if (nextTotalQuestions === prev.totalQuestions) return prev;
      return { ...prev, totalQuestions: nextTotalQuestions };
    });
  }, [effectiveMaxQuestions, canCustomize]);

  const handleStartExam = async () => {
    if (!wizard.universityId || !wizard.departmentId || !wizard.courseId) {
      toast.error('Please complete all selections');
      return;
    }

    if (effectiveMaxQuestions <= 0) {
      toast.error('Daily exam limit reached for this course. Please try again after reset.');
      return;
    }

    try {
      setSubmitting(true);
      const cappedQuestionCount = Math.max(1, Math.min(wizard.totalQuestions, Math.max(1, effectiveMaxQuestions)));
      if (cappedQuestionCount !== wizard.totalQuestions) {
        setWizard((prev) => ({ ...prev, totalQuestions: cappedQuestionCount }));
      }

      // Backend will filter approved questions and enforce tier restrictions
      const response = await examService.startExam({
        universityId: wizard.universityId,
        departmentId: wizard.departmentId,
        courseId: wizard.courseId,
        examType: wizard.examType,
        totalQuestions: cappedQuestionCount,
        durationMinutes: wizard.durationMinutes,
        topicIds: wizard.topicIds.length > 0 ? wizard.topicIds : undefined,
        difficulty: wizard.difficulty,
      });

      sessionStorage.setItem(
        `examSession:${response.examSessionId}`,
        JSON.stringify({
          examSessionId: response.examSessionId,
          questions: response.questions,
          startTime: response.startTime,
          tierInfo: {
            ...(response.tierInfo || {}),
            remainingToday:
              response?.tierInfo?.remainingTodayForCourse ??
              response?.tierInfo?.remainingToday ??
              dailyLimit?.remainingToday,
            dailyLimit: response?.tierInfo?.dailyLimit ?? dailyLimit?.dailyLimit,
            resetsAt: response?.tierInfo?.resetsAt ?? dailyLimit?.resetsAt,
          },
          durationMinutes: wizard.durationMinutes,
        })
      );

      toast.success('Exam started successfully');
      navigate(`/exams/${response.examSessionId}/in-progress`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to start exam. Please try again.';
      if (err?.response?.status === 429) {
        toast.error(errorMsg || 'Daily exam limit reached for this course. Try again after reset.');
        return;
      }
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setWizard((prev) => ({
      ...prev,
      topicIds: prev.topicIds.includes(topicId)
        ? prev.topicIds.filter((id) => id !== topicId)
        : [...prev.topicIds, topicId],
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Start New Exam</h1>
        <p className="text-gray-600">
          {step === 'university' && 'Step 1: Select your university'}
          {step === 'department' && 'Step 2: Select your department'}
          {step === 'course' && 'Step 3: Select your course'}
          {step === 'config' && 'Step 4: Configure your exam'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 flex items-center gap-2">
        {(['university', 'department', 'course', 'config'] as const).map(
          (s, idx) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-2 flex-1 rounded-full transition-colors ${
                  step === s || (['university', 'department', 'course', 'config'].indexOf(step) >= idx)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
              {idx < 3 && <div className="w-2" />}
            </div>
          )
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        {step === 'university' && (
          <UniversitySelector
            value={wizard.universityId}
            onSelect={(id) => setWizard((prev) => ({ ...prev, universityId: id }))}
            onNext={() => setStep('department')}
          />
        )}

        {step === 'department' && (
          <DepartmentSelector
            universityId={wizard.universityId}
            value={wizard.departmentId}
            onSelect={(id) => setWizard((prev) => ({ ...prev, departmentId: id }))}
            onNext={() => setStep('course')}
            onBack={() => setStep('university')}
          />
        )}

        {step === 'course' && (
          <CourseSelector
            departmentId={wizard.departmentId}
            value={wizard.courseId}
            onSelect={(id) => setWizard((prev) => ({ ...prev, courseId: id }))}
            onNext={() => setStep('config')}
            onBack={() => setStep('department')}
          />
        )}

        {step === 'config' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Exam</h2>
              <p className="text-gray-600">Customize your exam settings</p>
            </div>

            {/* Plan Info */}
            {!canCustomize && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  <strong>Plan Restriction:</strong> {getRestrictionMessage(user?.plan, user?.role, 'canCustomizeQuestionCount')}
                </p>
              </div>
            )}

            {/* Number of Questions */}
            <div>
              {loadingDailyLimit ? (
                <div className="text-sm text-gray-500 mb-3">Checking daily exam limit...</div>
              ) : dailyLimit ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3 text-sm text-amber-900">
                  <p>
                    Daily limit: <strong>{dailyLimit.dailyLimit}</strong> • Used today: <strong>{dailyLimit.usedToday}</strong> • Remaining: <strong>{dailyLimit.remainingToday}</strong>
                  </p>
                  {dailyLimit.resetsAt && (
                    <p className="text-xs mt-1">Resets at: {new Date(dailyLimit.resetsAt).toLocaleString()}</p>
                  )}
                </div>
              ) : null}

              <label htmlFor="questions" className="block text-sm font-semibold text-gray-900 mb-3">
                Number of Questions: <span className="text-green-600">{wizard.totalQuestions}</span>
                {!canCustomize && <span className="text-xs text-gray-500 ml-2">(Fixed at {effectiveMaxQuestions})</span>}
              </label>
              {canCustomize && (
                <>
                  <input
                    id="questions"
                    type="range"
                    min="1"
                    max={Math.max(1, effectiveMaxQuestions)}
                    step="1"
                    value={wizard.totalQuestions}
                    onChange={(e) =>
                      setWizard((prev) => ({
                        ...prev,
                        totalQuestions: parseInt(e.target.value),
                      }))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>1 question</span>
                      <span>{effectiveMaxQuestions} questions</span>
                  </div>
                </>
              )}
              {!canCustomize && (
                <div className="p-2 bg-gray-50 rounded text-sm text-gray-600 mt-2">
                    Your current limit allows up to {effectiveMaxQuestions} questions now
                </div>
              )}
                {effectiveMaxQuestions <= 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 mt-2">
                    No questions remaining for this course today. Please try again after reset.
                  </div>
                )}
            </div>

            {/* Exam Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Exam Type</label>
              <div className="grid grid-cols-3 gap-3">
                {(['practice', 'mock', 'final'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setWizard((prev) => ({ ...prev, examType: type }))}
                    className={`p-3 rounded-lg border-2 transition-all capitalize ${
                      wizard.examType === type
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Duration (minutes)</label>
              <select
                value={wizard.durationMinutes}
                onChange={(e) => setWizard((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              >
                {[10, 15, 20, 25, 30, 35, 40, 45, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Difficulty Level (Optional)
              </label>
              {accessibleLevels.length < 3 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Your plan can access: {accessibleLevels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {([undefined, 'easy', 'medium', 'hard'] as const)
                  .filter((level) => !level || accessibleLevels.includes(level))
                  .map((level) => (
                  <button
                    key={level || 'any'}
                    onClick={() => setWizard((prev) => ({ ...prev, difficulty: level }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      wizard.difficulty === level
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p
                      className={`font-medium capitalize ${
                        wizard.difficulty === level ? 'text-green-700' : 'text-gray-700'
                      }`}
                    >
                      {level ? level : 'All Levels'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Topics */}
            {loadingTopics ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-green-600 animate-spin" />
              </div>
            ) : topics.length > 0 ? (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  <BookOpen className="inline w-4 h-4 mr-2" />
                  Topics (Optional - Leave blank for all)
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {topics.map((topic) => (
                    <label key={getTopicId(topic)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wizard.topicIds.includes(getTopicId(topic))}
                        onChange={() => handleTopicToggle(getTopicId(topic))}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                        {topic.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setStep('course')}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleStartExam}
                disabled={submitting || effectiveMaxQuestions <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Exam
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
