import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { adminService } from '../../../lib/services/admin.service';
import { questionService } from '../../../lib/services/question.service';
import { academicService } from '../../../lib/services/academic.service';
import { Eye, Trash2, CheckCircle, XCircle, Search, Loader, ArrowLeft, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { University, Department, Course, Topic } from '../../../types';

export function QuestionManagement() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'manual'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState('');

  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [selectedUniversityId, setSelectedUniversityId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const getEntityId = (entity: any): string => entity?.id || entity?._id || '';
  const getQuestionId = (question: any): string => question?._id || question?.id || '';

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversityId) {
      loadDepartments(selectedUniversityId);
    } else {
      setDepartments([]);
      setSelectedDepartmentId('');
      setCourses([]);
      setSelectedCourseId('');
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedUniversityId]);

  useEffect(() => {
    if (selectedDepartmentId) {
      loadCourses(selectedDepartmentId);
    } else {
      setCourses([]);
      setSelectedCourseId('');
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (selectedCourseId) {
      loadTopics(selectedCourseId);
    } else {
      setTopics([]);
      setSelectedTopicId('');
      setQuestions([]);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedTopicId) {
      loadQuestions();
    } else {
      setQuestions([]);
    }
  }, [selectedTopicId, activeTab]);

  const loadUniversities = async () => {
    try {
      const data = await academicService.getUniversities();
      setUniversities(data || []);
    } catch {
      toast.error('Failed to load universities');
    }
  };

  const loadDepartments = async (universityId: string) => {
    try {
      const data = await academicService.getDepartments(universityId);
      setDepartments(data || []);
    } catch {
      toast.error('Failed to load departments');
    }
  };

  const loadCourses = async (departmentId: string) => {
    try {
      const data = await academicService.getCourses(departmentId);
      setCourses(data || []);
    } catch {
      toast.error('Failed to load courses');
    }
  };

  const loadTopics = async (courseId: string) => {
    try {
      const data = await academicService.getTopics(courseId);
      setTopics(data || []);
    } catch {
      toast.error('Failed to load topics');
    }
  };

  const loadQuestions = async () => {
    if (!selectedTopicId) return;

    try {
      setIsLoading(true);
      const result = await questionService.getQuestions({
        topicId: selectedTopicId,
        page: 1,
        limit: 200,
      });

      let normalized = (result.data || []).map((question: any) => ({
        ...question,
        _id: question?._id || question?.id,
        text: question?.text || question?.question || '',
        status: question?.status || (question?.approved ? 'approved' : 'pending'),
        sourceLabel: (() => {
          const source = String(question?.source || '').toLowerCase();
          const sourceType = String(question?.sourceType || '').toLowerCase();

          if (source === 'ocr' || sourceType === 'ocr') return 'OCR';
          if (source === 'ai' || sourceType === 'ai' || sourceType === 'generated' || sourceType === 'extracted') return 'AI';
          if (source === 'human' || sourceType === 'manual') return 'Human';
          return question?.source || question?.sourceType || 'Unknown';
        })(),
      }));

      if (activeTab === 'pending') {
        normalized = normalized.filter((q: any) => q.status === 'pending');
      } else if (activeTab === 'approved') {
        normalized = normalized.filter((q: any) => q.status === 'approved');
      } else if (activeTab === 'manual') {
        normalized = normalized.filter((q: any) =>
          q?.sourceType === 'manual' || q?.sourceLabel === 'Human' || q?.source === 'Human'
        );
      }

      setQuestions(normalized);
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load questions');
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveQuestion = async (questionId: string) => {
    try {
      await questionService.approveQuestion(questionId);
      setQuestions((previous) => {
        const next = previous.map((q) =>
          getQuestionId(q) === questionId ? { ...q, status: 'approved' } : q
        );
        if (activeTab === 'pending') {
          return next.filter((q) => getQuestionId(q) !== questionId);
        }
        return next;
      });
      toast.success('Question approved');
    } catch {
      toast.error('Failed to approve question');
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      await questionService.rejectQuestion(questionId, 'Rejected by admin');
      setQuestions((previous) => {
        const next = previous.map((q) =>
          getQuestionId(q) === questionId ? { ...q, status: 'rejected' } : q
        );
        if (activeTab === 'pending') {
          return next.filter((q) => getQuestionId(q) !== questionId);
        }
        return next;
      });
      toast.success('Question rejected');
    } catch {
      toast.error('Failed to reject question');
    }
  };

  const handleEditQuestion = async (question: any) => {
    try {
      if (!selectedCourseId) {
        toast.error('Please select a course first');
        return;
      }

      const questionId = getQuestionId(question);
      if (!questionId) {
        toast.error('Invalid question selected');
        return;
      }

      const nextText = window.prompt('Edit question text:', question?.text || '');
      if (nextText === null) return;
      if (!nextText.trim()) {
        toast.error('Question text cannot be empty');
        return;
      }

      const updated = await adminService.updateQuestion(selectedCourseId, questionId, {
        text: nextText.trim(),
      });

      setQuestions((previous) => previous.map((q) => (getQuestionId(q) === questionId ? { ...q, ...updated } : q)));
      toast.success('Question updated');
    } catch {
      toast.error('Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      if (!selectedCourseId) {
        toast.error('Please select a course first');
        return;
      }

      await adminService.deleteQuestion(selectedCourseId, questionId);
      setQuestions((previous) => previous.filter((q) => getQuestionId(q) !== questionId));
      toast.success('Question deleted');
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const getNormalizedOptions = (question: any): Array<{ id: string; text: string }> => {
    const options = question?.options;

    if (Array.isArray(options)) {
      return options.map((option: any, index: number) => ({
        id: option?.id || option?.option || String.fromCharCode(65 + index),
        text: option?.text || option?.value || '',
      }));
    }

    if (options && typeof options === 'object') {
      return Object.entries(options).map(([id, value]) => {
        if (value && typeof value === 'object') {
          return { id, text: String((value as any).text || '') };
        }
        return { id, text: String(value || '') };
      });
    }

    return [];
  };

  const filteredQuestions = questions.filter((question) =>
    (question?.text || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate('/admin/questions')}
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Question Bank
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Question Management</h1>
          <p className="text-gray-600 mt-2">View, approve, edit, and delete questions by topic</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
            <select
              value={selectedUniversityId}
              onChange={(e) => setSelectedUniversityId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select university</option>
              {universities.map((university) => {
                const universityId = getEntityId(university);
                return (
                  <option key={universityId} value={universityId}>
                    {university.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              disabled={!selectedUniversityId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            >
              <option value="">Select department</option>
              {departments.map((department) => {
                const departmentId = getEntityId(department);
                return (
                  <option key={departmentId} value={departmentId}>
                    {department.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={!selectedDepartmentId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            >
              <option value="">Select course</option>
              {courses.map((course: any) => {
                const courseId = getEntityId(course);
                const courseCode = course.code || course.courseCode || '';
                const courseTitle = course.title || course.name || '';
                const displayName = courseCode && courseCode.toString().trim() ? `${courseCode} - ${courseTitle}` : courseTitle || `Course ${courseId}`;
                return (
                  <option key={courseId} value={courseId}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={!selectedCourseId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            >
              <option value="">Select topic</option>
              {topics.map((topic) => {
                const topicId = getEntityId(topic);
                return (
                  <option key={topicId} value={topicId}>
                    {topic.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200">
          {['all', 'pending', 'approved', 'manual'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'all' | 'pending' | 'approved' | 'manual')}
              className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {!selectedTopicId ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Select a topic to view questions.</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center min-h-[260px]">
              <Loader className="w-7 h-7 text-green-600 animate-spin" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-600">No questions found for this filter.</p>
            </div>
          ) : (
            filteredQuestions.map((question) => {
              const questionId = getQuestionId(question);
              const options = getNormalizedOptions(question);
              const isExpanded = expandedQuestionId === questionId;

              return (
                <div key={questionId} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const sourceLabel = String(question?.sourceLabel || '').toUpperCase();
                          const sourceColorClass =
                            sourceLabel === 'OCR'
                              ? 'bg-purple-100 text-purple-700'
                              : sourceLabel === 'AI'
                              ? 'bg-blue-100 text-blue-700'
                              : sourceLabel === 'HUMAN'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700';

                          return (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${sourceColorClass}`}>
                              {question?.sourceLabel || 'Unknown'}
                            </span>
                          );
                        })()}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          question?.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : question?.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {question?.status || 'unknown'}
                        </span>
                        <span className="text-xs text-gray-500">{question?.difficulty || 'n/a'}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{question?.text}</h3>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? '' : questionId)}
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      title="View question details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="p-2 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                      title="Edit question"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    {question?.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveQuestion(questionId)}
                          className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          title="Approve question"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleRejectQuestion(questionId)}
                          className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          title="Reject question"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteQuestion(questionId)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Delete question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                      {options.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-700">Options</p>
                          {options.map((option) => (
                            <div key={option.id} className={`p-2 rounded border ${
                              String(option.id).toUpperCase() === String(question?.correctAnswer || '').toUpperCase()
                                ? 'border-green-400 bg-green-50'
                                : 'border-gray-200 bg-white'
                            }`}>
                              <span className="font-semibold mr-2">{option.id}.</span>
                              <span>{option.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {question?.explanation && (
                        <div>
                          <p className="text-xs font-semibold text-gray-700 mb-1">Explanation</p>
                          <p className="text-sm text-gray-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
