import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  ArrowRight,
  Download,
  Share2,
  Loader2,
} from 'lucide-react';
import { ExamQuestionResult, ExamSubmitResponse } from '../../types';
import { examService } from '../../lib/services/exam.service';

const formatDuration = (seconds?: number) => {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getOptionText = (question: ExamQuestionResult, optionId?: string) => {
  if (!optionId) return '—';
  if (!Array.isArray(question.options)) return optionId;
  const match = question.options.find((option: any) => {
    const optionKey = String(option._id || option.id || '');
    return optionKey === String(optionId);
  });
  if (match?.text) return match.text;
  if (typeof optionId === 'string' && optionId.length === 1) {
    const letterIndex = optionId.charCodeAt(0) - 65;
    if (letterIndex >= 0 && letterIndex < question.options.length) {
      return question.options[letterIndex]?.text || optionId;
    }
  }
  return optionId;
};

export function ExamResults() {
  const { examSessionId } = useParams<{ examSessionId: string }>();
  const [result, setResult] = useState<ExamSubmitResponse | null>(null);
  const [storageChecked, setStorageChecked] = useState(false);

  useEffect(() => {
    if (!examSessionId) return;
    const stored = sessionStorage.getItem(`examResult:${examSessionId}`);
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to parse stored exam results:', err);
      }
    }
    setStorageChecked(true);
  }, [examSessionId]);

  const { data: fetchedResult, isLoading: isFetching } = useQuery({
    queryKey: ['exam-results', examSessionId],
    queryFn: () => examService.getResults(examSessionId!),
    enabled: !!examSessionId && storageChecked && !result,
  });

  useEffect(() => {
    if (!examSessionId || !fetchedResult) return;
    setResult(fetchedResult);
    sessionStorage.setItem(
      `examResult:${examSessionId}`,
      JSON.stringify(fetchedResult)
    );
  }, [examSessionId, fetchedResult]);

  const stats = useMemo(() => {
    if (!result) {
      return null;
    }

    const toNumber = (value: unknown, fallback = 0): number => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    const totalQuestions =
      toNumber(result.totalQuestions, NaN) ||
      toNumber(result.results?.length, 0);

    const correctAnswers =
      toNumber(result.correctAnswers, NaN) ||
      toNumber(result.results?.filter((q) => q.isCorrect).length, 0);

    const incorrectAnswers = Math.max(totalQuestions - correctAnswers, 0);
    const percentage =
      toNumber(result.percentage, NaN) ||
      (totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0);
    const passed = typeof result.isPassed === 'boolean' ? result.isPassed : percentage >= 40;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      percentage,
      timeTaken: formatDuration(result.timeTaken),
      passed,
    };
  }, [result]);

  if (!storageChecked || isFetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Layout>
    );
  }

  if (!result || !stats) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Exam results not found</h1>
          <p className="text-gray-600">
            We could not load your results. Please check your exam history or start a new exam.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/exams"
              className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              View Exam History
            </Link>
            <Link
              to="/exams/start"
              className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              Start New Exam
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const questionBreakdown = result.results || [];
  console.log('[ExamResults] Result data:', result);
  console.log('[ExamResults] Question breakdown count:', questionBreakdown.length);
  console.log('[ExamResults] First question sample:', questionBreakdown[0]);

  const handleDownloadReport = () => {
    if (!result) return;

    const rows = questionBreakdown.map((q, index) => ({
      number: index + 1,
      question: q.text || '',
      yourAnswer: getOptionText(q, q.userAnswer),
      correctAnswer: getOptionText(q, q.correctAnswer),
      isCorrect: q.isCorrect ? 'Yes' : 'No',
    }));

    const header = ['Question #', 'Question', 'Your Answer', 'Correct Answer', 'Correct'];
    const csv = [header.join(',')]
      .concat(
        rows.map((row) =>
          [
            row.number,
            JSON.stringify(row.question),
            JSON.stringify(row.yourAnswer),
            JSON.stringify(row.correctAnswer),
            row.isCorrect,
          ].join(',')
        )
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exam-report-${result.examSessionId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShareResults = async () => {
    if (!result || !stats) return;

    const shareText = `I scored ${stats.percentage}% on my exam!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Exam Results',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback below
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Results Header */}
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
              stats.passed ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            <Trophy
              className={`w-10 h-10 ${
                stats.passed ? 'text-green-600' : 'text-red-600'
              }`}
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {stats.passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xl text-gray-600">Your exam results are ready</p>
        </div>

        {/* Score Card */}
        <div
          className={`bg-gradient-to-br rounded-2xl p-8 text-white ${
            stats.passed ? 'from-green-600 to-green-700' : 'from-red-600 to-red-700'
          }`}
        >
          <div className="text-center mb-6">
            <div className="text-7xl font-bold mb-2">{stats.percentage}%</div>
            <div className="text-xl opacity-90">Your Score</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stats.correctAnswers}</div>
              <div className="text-sm opacity-90">Correct</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stats.incorrectAnswers}</div>
              <div className="text-sm opacity-90">Incorrect</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stats.percentage}%</div>
              <div className="text-sm opacity-90">Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stats.timeTaken}</div>
              <div className="text-sm opacity-90">Time Taken</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <a
            href="#question-breakdown"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group"
          >
            <CheckCircle className="w-8 h-8 text-green-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">Review Answers</h3>
            <p className="text-sm text-gray-600">See correct and submitted answers</p>
          </a>

          <Link
            to="/exams/start"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group"
          >
            <TrendingUp className="w-8 h-8 text-green-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">Practice Again</h3>
            <p className="text-sm text-gray-600">Improve your score</p>
          </Link>

          <Link
            to="/analytics"
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group"
          >
            <Target className="w-8 h-8 text-blue-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">View Analytics</h3>
            <p className="text-sm text-gray-600">Track your progress</p>
          </Link>

          <button
            onClick={handleShareResults}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors text-center group"
          >
            <Share2 className="w-8 h-8 text-purple-600 mb-2 mx-auto" />
            <h3 className="font-semibold text-gray-900 mb-1">Share Results</h3>
            <p className="text-sm text-gray-600">Show your achievement</p>
          </button>
        </div>

        {/* Question Breakdown */}
        <div id="question-breakdown" className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Review Your Answers</h2>
          </div>

          {questionBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No question details available. Your exam was submitted successfully.</p>
            </div>
          ) : (
            <div className="space-y-3">
            {questionBreakdown.map((q: any, index) => (
              <div
                key={q._id || q.id || index}
                className={`p-4 rounded-lg border-2 ${
                  q.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      q.isCorrect ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {q.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">Question {index + 1}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          q.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {q.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-3">{q.text || 'Question details unavailable'}</p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Your answer: </span>
                        <span
                          className={`font-medium ${
                            q.isCorrect ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {getOptionText(q, q.userAnswer)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Correct answer: </span>
                        <span className="font-medium text-green-700">
                          {getOptionText(q, q.correctAnswer)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Continue Button */}
        <div className="flex items-center justify-center gap-4 pt-8 border-t border-gray-200">
          <Link
            to="/exams/start"
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
          >
            Take Another Exam
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/dashboard"
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Next Steps</h2>
          <div className="space-y-3">
            <Link
              to="/materials"
              className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Review Study Materials</h3>
                <p className="text-sm text-gray-600">
                  Strengthen your understanding of weak areas
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="/analytics"
              className="flex items-center justify-between p-4 bg-white rounded-lg hover:shadow-md transition-shadow group"
            >
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Focus on Weak Topics</h3>
                <p className="text-sm text-gray-600">
                  Get personalized practice recommendations
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
