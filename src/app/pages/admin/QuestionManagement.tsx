import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Layout } from '../../components/Layout';
import { adminService, AdminQuestion, CreateQuestionRequest, QuestionOption } from '../../../lib/services/admin.service';
import { academicService } from '../../../lib/services/academic.service';
import { Plus, Eye, Trash2, CheckCircle, XCircle, Upload, Search, Loader, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { University, Department, Course, Topic } from '../../../types';

export function QuestionManagement() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'create' | 'upload' | 'import'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  // Remove uploadMode, not needed for study material upload

  // Create manual question state
  const [manualQuestion, setManualQuestion] = useState<CreateQuestionRequest>({
    text: '',
    questionType: 'mcq',
    difficulty: 'easy',
    topicId: '',
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
  });

  // Upload material state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadTopicId, setUploadTopicId] = useState('');

  useEffect(() => {
    loadUniversities();
  }, []);

  useEffect(() => {
    if (selectedUniversity) {
      loadDepartments();
    } else {
      setDepartments([]);
      setSelectedDepartment(null);
      setCourses([]);
      setSelectedCourse(null);
      setTopics([]);
      setSelectedTopicId('');
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedDepartment) {
      loadCourses();
    } else {
      setCourses([]);
      setSelectedCourse(null);
      setTopics([]);
      setSelectedTopicId('');
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedCourse) {
      loadTopics();
    } else {
      setTopics([]);
      setSelectedTopicId('');
    }
  }, [selectedCourse]);

  useEffect(() => {
    loadQuestions();
  }, [activeTab, selectedCourse, selectedUniversity]);

  const loadUniversities = async () => {
    try {
      const data = await academicService.getUniversities();
      setUniversities(data || []);
    } catch (err) {
      toast.error('Failed to load universities');
    }
  };

  const loadDepartments = async () => {
    const universityId = selectedUniversity?._id || selectedUniversity?.id;
    if (!universityId) return;
    try {
      const data = await academicService.getDepartments(universityId);
      setDepartments(data || []);
    } catch (err) {
      toast.error('Failed to load departments');
    }
  };

  const loadCourses = async () => {
    if (!selectedDepartment?.id) return;
    try {
      const data = await academicService.getCourses(selectedDepartment.id);
      setCourses(data || []);
    } catch (err) {
      toast.error('Failed to load courses');
    }
  };

  const loadTopics = async () => {
    if (!selectedCourse?.id) return;
    try {
      const data = await academicService.getTopics(selectedCourse.id);
      setTopics(data || []);
    } catch (err) {
      toast.error('Failed to load topics');
    }
  };

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      // Load questions based on active tab
      if (activeTab === 'pending' && selectedCourse?.id && selectedUniversity?.id) {
        const result = await adminService.getPendingQuestions(selectedCourse.id, selectedUniversity.id);
        setQuestions(result.data);
      } else if (activeTab === 'pending') {
        setQuestions([]);
      }
    } catch (err) {
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManualQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id || !manualQuestion.text || !manualQuestion.topicId) {
      toast.error('Please fill required fields');
      return;
    }

    if (manualQuestion.questionType === 'mcq' && (!manualQuestion.options || manualQuestion.options.length < 2)) {
      toast.error('MCQ requires at least 2 options');
      return;
    }

    try {
      const created = await adminService.createQuestion(selectedCourse.id, manualQuestion);
      setQuestions([...questions, created]);
      toast.success('Question created successfully');
      resetManualForm();
      setActiveTab('all');
    } catch (err) {
      toast.error('Failed to create question');
    }
  };

  const resetManualForm = () => {
    setManualQuestion({
      text: '',
      questionType: 'mcq',
      difficulty: 'easy',
      topicId: '',
      options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
    });
  };

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse?.id || !uploadFile || !uploadTitle) {
      toast.error('Please fill required fields and select a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      if (uploadTopicId) formData.append('topicId', uploadTopicId);

      // Use the correct study material upload endpoint
      const material = await adminService.uploadStudyMaterial(selectedCourse.id, formData);
      toast.success('Study material uploaded successfully');
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setUploadTopicId('');
      setActiveTab('all');
    } catch (err) {
      toast.error('Failed to upload study material');
    }
  };

  const handleApproveQuestion = async (questionId: string) => {
    try {
      const adminId = localStorage.getItem('userId') || '';
      if (!selectedCourse?.id) {
        toast.error('Please select a course first');
        return;
      }
      const updated = await adminService.approveQuestion(selectedCourse.id, questionId, {
        adminId,
        notes: ''
      });
      setQuestions(questions.map(q => q._id === questionId ? updated : q));
      toast.success('Question approved');
    } catch (err) {
      toast.error('Failed to approve question');
    }
  };

  const handleRejectQuestion = async (questionId: string) => {
    try {
      const adminId = localStorage.getItem('userId') || '';
      if (!selectedCourse?.id) {
        toast.error('Please select a course first');
        return;
      }
      const updated = await adminService.rejectQuestion(selectedCourse.id, questionId, {
        adminId,
        notes: 'Rejected by admin'
      });
      setQuestions(questions.map(q => q._id === questionId ? updated : q));
      toast.success('Question rejected');
    } catch (err) {
      toast.error('Failed to reject question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    
    try {
      if (!selectedCourse?.id) {
        toast.error('Please select a course first');
        return;
      }
      await adminService.deleteQuestion(selectedCourse.id, questionId);
      setQuestions(questions.filter(q => q._id !== questionId));
      toast.success('Question deleted');
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const filteredQuestions = questions.filter(q => {
    let matches = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'pending') matches = matches && q.status === 'pending';
    if (activeTab === 'approved') matches = matches && q.status === 'approved';
    return matches;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      </Layout>
    );
  }

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
          <p className="text-gray-600 mt-2">Create and manage questions (3 methods)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
            <select
              value={selectedUniversity?.id || ''}
              onChange={(e) => {
                const uni = universities.find(u => u.id === e.target.value) || null;
                setSelectedUniversity(uni);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a university</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <select
              value={selectedDepartment?.id || ''}
              onChange={(e) => {
                const dept = departments.find(d => d.id === e.target.value) || null;
                setSelectedDepartment(dept);
              }}
              disabled={!selectedUniversity}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
            <select
              value={selectedCourse?.id || ''}
              onChange={(e) => {
                const course = courses.find(c => c.id === e.target.value) || null;
                setSelectedCourse(course);
              }}
              disabled={!selectedDepartment}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a course</option>
              {courses.map((course: any) => {
                const courseCode = course.code || course.courseCode || '';
                const courseTitle = course.title || course.name || '';
                const displayName = courseCode && courseCode.toString().trim() ? `${courseCode} - ${courseTitle}` : courseTitle || `Course ${course.id}`;
                return (
                  <option key={course.id} value={course.id}>
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
              onChange={(e) => {
                setSelectedTopicId(e.target.value);
                setManualQuestion({ ...manualQuestion, topicId: e.target.value });
                setUploadTopicId(e.target.value);
              }}
              disabled={!selectedCourse}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select a topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200">
          {['all', 'pending', 'approved', 'create', 'upload', 'import'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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

        {/* Create Manual Question */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">METHOD 1: Manual Question Creation</h2>
            <form onSubmit={handleCreateManualQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
                <textarea
                  value={manualQuestion.text}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, text: e.target.value })}
                  placeholder="Enter question text"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={manualQuestion.questionType}
                    onChange={(e) => setManualQuestion({ ...manualQuestion, questionType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="essay">Essay</option>
                    <option value="short-answer">Short Answer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty *</label>
                  <select
                    value={manualQuestion.difficulty}
                    onChange={(e) => setManualQuestion({ ...manualQuestion, difficulty: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic *</label>
                  <select
                    value={manualQuestion.topicId}
                    onChange={(e) => setManualQuestion({ ...manualQuestion, topicId: e.target.value })}
                    disabled={!selectedCourse}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {manualQuestion.questionType === 'mcq' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">MCQ Options *</label>
                  {manualQuestion.options?.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...(manualQuestion.options || [])];
                          newOptions[idx] = { ...option, text: e.target.value };
                          setManualQuestion({ ...manualQuestion, options: newOptions });
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) => {
                          const newOptions = [...(manualQuestion.options || [])];
                          newOptions[idx] = { ...option, isCorrect: e.target.checked };
                          setManualQuestion({ ...manualQuestion, options: newOptions });
                        }}
                        title="Mark as correct answer"
                        className="w-5 h-5"
                      />
                    </div>
                  ))}
                </div>
              )}

              {manualQuestion.questionType !== 'mcq' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer *</label>
                  <textarea
                    value={manualQuestion.correctAnswer || ''}
                    onChange={(e) => setManualQuestion({ ...manualQuestion, correctAnswer: e.target.value })}
                    placeholder="Provide the correct answer"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                <textarea
                  value={manualQuestion.explanation || ''}
                  onChange={(e) => setManualQuestion({ ...manualQuestion, explanation: e.target.value })}
                  placeholder="Question explanation"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Create Question
                </button>
                <button
                  type="button"
                  onClick={resetManualForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upload Material */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Study Material</h2>
            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material File *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.png,.jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Accepts: PDF, JPG, PNG</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Chapter 5 - Variables"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Material description"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic ID</label>
                <input
                  type="text"
                  value={uploadTopicId}
                  onChange={(e) => setUploadTopicId(e.target.value)}
                  placeholder="Topic ID (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Study Material
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Import Questions */}
        {activeTab === 'import' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">METHOD 3: Manual Import with Answers</h2>
            <p className="text-gray-600 mb-4">First upload material, then import questions from it with provided answers.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">Note: Use the Upload Materials page for full material management. This tab is for quick imports after uploading.</p>
            </div>
          </div>
        )}

        {/* Questions List */}
        {(activeTab === 'all' || activeTab === 'pending' || activeTab === 'approved') && (
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

            {filteredQuestions.length === 0 ? (
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-600">No questions found</p>
              </div>
            ) : (
              filteredQuestions.map(question => (
                <div key={question._id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 flex-1">{question.text}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          question.status === 'approved' ? 'bg-green-100 text-green-700' :
                          question.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {question.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        <span>Type: {question.questionType}</span>
                        <span>•</span>
                        <span>Difficulty: {question.difficulty}</span>
                        <span>•</span>
                        <span>Source: {question.source}</span>
                      </div>
                    </div>
                  </div>

                  {question.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleApproveQuestion(question._id)}
                        className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectQuestion(question._id)}
                        className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question._id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
