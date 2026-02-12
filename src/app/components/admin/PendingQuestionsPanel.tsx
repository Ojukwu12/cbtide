import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Question, QuestionOption } from '../../../types';
import { questionService } from '../../../lib/services/question.service';

interface PendingQuestionsState {
  questionId: string;
  isApproving?: boolean;
  rejectionReason?: string;
  showRejectDialog?: boolean;
}

export function PendingQuestionsPanel() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionStates, setActionStates] = useState<Record<string, PendingQuestionsState>>({});

  useEffect(() => {
    loadPendingQuestions();
  }, [user?.id]);

  const loadPendingQuestions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      // Note: In a real app, you'd use user's universityId after selecting it
      // For now, using a placeholder - backend should only show questions from the admin's university
      const data = await questionService.getPendingQuestions(user.id);
      setQuestions(data);
    } catch (err) {
      console.error('Failed to load pending questions:', err);
      setError('Failed to load pending questions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (questionId: string) => {
    try {
      setActionStates((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], isApproving: true },
      }));

      await questionService.approveQuestion(questionId);
      toast.success('Question approved');
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Failed to approve question:', err);
      toast.error('Failed to approve question');
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], isApproving: false },
      }));
    }
  };

  const handleRejectClick = (questionId: string) => {
    setActionStates((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], showRejectDialog: true },
    }));
  };

  const handleRejectConfirm = async (questionId: string) => {
    const reason =
      actionStates[questionId]?.rejectionReason || 'No reason provided';

    try {
      setActionStates((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], isApproving: true },
      }));

      await questionService.rejectQuestion(questionId, reason);
      toast.success('Question rejected');
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Failed to reject question:', err);
      toast.error('Failed to reject question');
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          isApproving: false,
          showRejectDialog: false,
          rejectionReason: '',
        },
      }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pending Questions Review</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve AI-generated or uploaded questions
          </p>
        </div>
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold">
          {questions.length} Pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">All caught up!</p>
          <p className="text-gray-600">There are no pending questions to review</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question) => (
            <div
              key={question.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900 flex-1">{question.question}</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                      question.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : question.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {question.difficulty}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {question.options.map((option: QuestionOption) => (
                    <span
                      key={option.id}
                      className={`px-3 py-1 rounded text-xs ${
                        option.text === question.correctAnswer
                          ? 'bg-green-100 text-green-700 font-semibold'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {option.text}
                    </span>
                  ))}
                </div>

                {question.explanation && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-1">Explanation:</p>
                    <p className="text-xs text-blue-800">{question.explanation}</p>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>Source: {question.sourceType}</span>
                  {question.createdBy && <span>By: {question.createdBy}</span>}
                </div>
              </div>

              {/* Reject Dialog */}
              {actionStates[question.id]?.showRejectDialog && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <label className="block text-xs font-semibold text-red-900 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={actionStates[question.id]?.rejectionReason || ''}
                    onChange={(e) =>
                      setActionStates((prev) => ({
                        ...prev,
                        [question.id]: {
                          ...prev[question.id],
                          rejectionReason: e.target.value,
                        },
                      }))
                    }
                    placeholder="Why is this question being rejected?"
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(question.id)}
                  disabled={actionStates[question.id]?.isApproving}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  {actionStates[question.id]?.isApproving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </>
                  )}
                </button>

                {actionStates[question.id]?.showRejectDialog ? (
                  <>
                    <button
                      onClick={() =>
                        setActionStates((prev) => ({
                          ...prev,
                          [question.id]: {
                            ...prev[question.id],
                            showRejectDialog: false,
                            rejectionReason: '',
                          },
                        }))
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectConfirm(question.id)}
                      disabled={actionStates[question.id]?.isApproving}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
                    >
                      {actionStates[question.id]?.isApproving ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Confirm Reject
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRejectClick(question.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={loadPendingQuestions}
        className="w-full mt-4 py-2 text-center text-sm text-green-600 hover:text-green-700 font-medium"
      >
        Refresh
      </button>
    </div>
  );
}
