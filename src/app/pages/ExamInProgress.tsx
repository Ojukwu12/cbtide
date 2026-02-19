import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { examService } from '@/lib/services/exam.service';
import toast from 'react-hot-toast';
import { ExamQuestion } from '@/types';

export function ExamInProgress() {
  const navigate = useNavigate();
  const { examSessionId } = useParams<{ examSessionId: string }>();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);
  const queryClient = useQueryClient();

  const getQuestionId = (question: any) => String(question?._id || question?.id || question?.questionId || '');
  const getOptionId = (option: any) => String(option?._id || option?.id || option?.value || '');
  const getQuestionText = (question: any) => question?.questionText || question?.question || question?.text || '';
  const getOptionText = (option: any) => option?.text || option?.optionText || option?.label || '';
  const questionStartRef = useRef<number>(Date.now());

  const getOptionsArray = (question: any): Array<{ id: string; label: string; raw: any }> => {
    const options = question?.options ?? question?.choices ?? question?.answers ?? question?.options?.options;

    if (Array.isArray(options)) {
      return options.map((option: any, index: number) => {
        const fallbackId = String.fromCharCode(65 + index);
        if (typeof option === 'string') {
          return { id: fallbackId, label: option, raw: option };
        }

        const resolvedId = getOptionId(option) || fallbackId;
        const label = getOptionText(option) || String(option?.value || option?.option || '');
        return { id: resolvedId || fallbackId, label, raw: option };
      });
    }

    if (options && typeof options === 'object') {
      return Object.entries(options).map(([key, value], index) => {
        const fallbackId = String.fromCharCode(65 + index);
        const resolvedId = String(key || fallbackId);
        return {
          id: resolvedId,
          label: typeof value === 'object' ? String((value as any)?.text || '') : String(value || ''),
          raw: value,
        };
      });
    }

    return [];
  };

  const getAnswerLetter = (question: any, optionId: string): string => {
    if (['A', 'B', 'C', 'D'].includes(optionId.toUpperCase())) {
      return optionId.toUpperCase();
    }

    const optionsArray = getOptionsArray(question);
    const option = optionsArray.find((opt) => String(opt.id) === optionId)?.raw;
    const direct = String(option?.option || option?.id || optionId || '').toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(direct)) return direct;

    const index = optionsArray.findIndex((opt) => String(opt.id) === optionId);
    const letters = ['A', 'B', 'C', 'D'];
    return typeof index === 'number' && index >= 0 ? letters[index] || direct : direct;
  };

  useEffect(() => {
    if (!examSessionId) {
      setLoadError('Missing exam session. Please start a new exam.');
      setIsLoading(false);
      return;
    }

    const stored = sessionStorage.getItem(`examSession:${examSessionId}`);
    if (!stored) {
      setLoadError('Exam session not found. Please start a new exam.');
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        questions?: ExamQuestion[];
        startTime?: string;
        durationMinutes?: number;
      } | ExamQuestion[];
      const storedQuestions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!storedQuestions || storedQuestions.length === 0) {
        setLoadError('No questions found for this exam session.');
      } else {
        setQuestions(storedQuestions);
      }

      if (!Array.isArray(parsed)) {
        const durationMinutes = parsed.durationMinutes;
        if (typeof durationMinutes === 'number' && remainingSeconds === null) {
          const startTime = parsed.startTime ? new Date(parsed.startTime).getTime() : Date.now();
          const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
          const totalSeconds = Math.max(0, Math.floor(durationMinutes * 60));
          setRemainingSeconds(Math.max(totalSeconds - elapsedSeconds, 0));
        }
      }
    } catch (err) {
      console.error('Failed to load exam session:', err);
      setLoadError('Failed to load exam session. Please start again.');
    } finally {
      setIsLoading(false);
    }
  }, [examSessionId]);

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [currentQuestion]);

  useEffect(() => {
    if (!examSessionId) return;

    let isMounted = true;

    const loadSummary = async () => {
      try {
        const summary = await examService.getExamSummary(examSessionId);
        if (!isMounted) return;

        const remainingTime =
          summary?.remainingTime ??
          summary?.remainingTimeSeconds ??
          (typeof summary?.remainingTimeMinutes === 'number'
            ? summary.remainingTimeMinutes * 60
            : undefined);

        if (typeof remainingTime === 'number') {
          setRemainingSeconds(remainingTime);
          return;
        }

        if (typeof summary?.durationMinutes === 'number' && summary?.durationMinutes > 0) {
          setRemainingSeconds(summary.durationMinutes * 60);
        }
      } catch {
        // Ignore summary fetch errors and keep timer hidden
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [examSessionId]);

  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev === null ? null : Math.max(prev - 1, 0)));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit exam mutation
  const submitMutation = useMutation({
    mutationFn: () => examService.submitExam(examSessionId!, { answers }),
    onSuccess: (result) => {
      if (examSessionId) {
        sessionStorage.setItem(
          `examResult:${examSessionId}`,
          JSON.stringify(result)
        );
      }
      queryClient.invalidateQueries({ queryKey: ['exam-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
      queryClient.invalidateQueries({ queryKey: ['weak-areas'] });
      queryClient.invalidateQueries({ queryKey: ['strong-areas'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard-position'] });
      toast.success('Exam submitted successfully!');
      navigate(`/exams/${examSessionId}/results`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to submit exam');
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: (data: { questionId: string; selectedAnswer: string }) =>
      examService.submitAnswer(examSessionId!, data),
  });

  const handleAnswerSelect = (optionId: string) => {
    const question = questions[currentQuestion];
    if (!question) return;
    const questionId = getQuestionId(question);
    if (!questionId) return;
    const selectedAnswer = getAnswerLetter(question, optionId);

    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedAnswer
    }));

    if (examSessionId) {
      const timeSpentSeconds = Math.max(0, Math.round((Date.now() - questionStartRef.current) / 1000));
      submitAnswerMutation.mutate({
        questionId,
        selectedAnswer,
        timeSpentSeconds,
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFlagQuestion = () => {
    const question = questions[currentQuestion];
    if (!question) return;

    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      const questionId = getQuestionId(question);
      if (!questionId) return newSet;
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds > 0) return;
    if (autoSubmittedRef.current) return;

    autoSubmittedRef.current = true;
    submitMutation.mutate();
  }, [remainingSeconds, submitMutation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">{loadError || 'Exam not found'}</p>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const currentQuestionId = getQuestionId(question);
  const selectedAnswer = currentQuestionId ? answers[currentQuestionId] : undefined;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Exam in Progress</h1>
              <p className="text-sm text-gray-600">Answer all questions carefully</p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Progress */}
              <div className="hidden md:block">
                <div className="text-sm text-gray-600 mb-1">
                  Progress: {answeredCount}/{questions.length}
                </div>
                <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {remainingSeconds !== null && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Time remaining</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatTime(remainingSeconds)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Question Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      Question {currentQuestion + 1} of {questions.length}
                    </span>
                    {flaggedQuestions.has(currentQuestionId) && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Flagged
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                    {getQuestionText(question)}
                  </h2>
                </div>
                <button
                  onClick={handleFlagQuestion}
                  className={`p-2 rounded-lg transition-colors ${
                    flaggedQuestions.has(currentQuestionId)
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {getOptionsArray(question).map((option) => {
                  const optionId = option.id;
                  return (
                    <button
                      key={optionId}
                      onClick={() => handleAnswerSelect(optionId)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedAnswer === optionId
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedAnswer === optionId
                            ? 'border-green-600 bg-green-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedAnswer === optionId && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className={selectedAnswer === optionId ? 'text-green-700' : 'text-gray-900'}>
                          {option.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitMutation.isPending}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitMutation.isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                  Submit Exam
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Question Navigator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {questions.map((q: any, index: number) => {
                  const questionId = getQuestionId(q);
                  return (
                    <button
                      key={questionId || index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all relative ${
                        currentQuestion === index
                          ? 'bg-green-600 text-white'
                          : (questionId && answers[questionId])
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                      {questionId && flaggedQuestions.has(questionId) && (
                        <Flag className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" fill="currentColor" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 rounded" />
                  <span className="text-gray-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 rounded" />
                  <span className="text-gray-600">Not answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600">Flagged</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Exam?</h3>
            <p className="text-gray-600 mb-6">
              You have answered {answeredCount} out of {questions.length} questions. 
              Are you sure you want to submit?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Review Answers
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
