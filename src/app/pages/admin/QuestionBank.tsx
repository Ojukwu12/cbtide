import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/Layout';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock,
  Edit2,
  BookOpen,
  AlertCircle,
  Plus,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';
import { adminService } from '../../../lib/services/admin.service';
import { questionService } from '../../../lib/services/question.service';
import { academicService } from '../../../lib/services/academic.service';
import { sourceMaterialService } from '../../../lib/services/sourceMaterial.service';
import { Question } from '../../../types';
import { toast } from 'sonner';

// Manual question creation schema
const manualQuestionSchema = z.object({
  text: z.string().min(10, 'Question must be at least 10 characters'),
  courseId: z.string().min(1, 'Course is required'),
  topicId: z.string().min(1, 'Topic is required'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().min(1, 'Option C is required'),
  optionD: z.string().min(1, 'Option D is required'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  explanation: z.string().optional(),
});

type ManualQuestionForm = z.infer<typeof manualQuestionSchema>;

export function QuestionBank() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'easy' | 'medium' | 'hard' | 'all'>('all');
  const [showMaterialUpload, setShowMaterialUpload] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileType, setUploadFileType] = useState<'' | 'pdf' | 'image' | 'text' | 'docx'>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState('');
  const [editingCourseId, setEditingCourseId] = useState('');
  const [editForm, setEditForm] = useState({
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    explanation: '',
  });
  const queryClient = useQueryClient();

  const getEntityId = (entity: any): string => entity?.id || entity?._id || '';
  const getMaterialId = (material: any): string => material?.id || material?._id || '';

  // Fetch all questions
  const { data: questionsData = { data: [], total: 0, page: 1, limit: 10 }, isLoading: questionsLoading } = useQuery({
    queryKey: ['all-questions', currentPage],
    queryFn: () => questionService.getQuestions({ page: currentPage, limit: pageSize }),
  });

  const { data: allQuestionTotals } = useQuery({
    queryKey: ['all-question-totals'],
    queryFn: async () => {
      const [all, pending, approved] = await Promise.all([
        questionService.getQuestions({ page: 1, limit: 1 }),
        questionService.getQuestions({ page: 1, limit: 1, status: 'pending' }),
        questionService.getQuestions({ page: 1, limit: 1, status: 'approved' }),
      ]);

      return {
        total: Number((all as any)?.total || 0),
        pending: Number((pending as any)?.total || 0),
        approved: Number((approved as any)?.total || 0),
      };
    },
  });

  const questions = questionsData.data || [];

  // Fetch all universities/courses
  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: () => academicService.getUniversities(),
  });

  // Fetch departments for selected university
  const { data: departmentsData = [] } = useQuery({
    queryKey: ['departments', selectedUniversity],
    queryFn: () => academicService.getDepartments(selectedUniversity),
    enabled: !!selectedUniversity,
  });

  // Fetch courses for selected department
  const { data: coursesData = [] } = useQuery({
    queryKey: ['courses', selectedDepartment],
    queryFn: () => academicService.getCourses(selectedDepartment),
    enabled: !!selectedDepartment,
  });

  // Fetch topics for selected course
  const { data: topicsData = [] } = useQuery({
    queryKey: ['topics', selectedCourse],
    queryFn: () => academicService.getTopics(selectedCourse),
    enabled: !!selectedCourse,
  });

  const scopedTopicsData = useMemo(
    () =>
      (topicsData as any[]).filter((topic: any) => {
        const topicCourseId = String(topic?.courseId || topic?.course?._id || topic?.course?.id || selectedCourse || '');
        return !selectedCourse || topicCourseId === selectedCourse;
      }),
    [topicsData, selectedCourse]
  );

  useEffect(() => {
    if (!selectedTopic) return;
    const topicExistsInCourse = scopedTopicsData.some((topic: any) => getEntityId(topic) === selectedTopic);
    if (!topicExistsInCourse) {
      setSelectedTopic('');
    }
  }, [selectedTopic, scopedTopicsData]);

  const noDepartmentsFound = !!selectedUniversity && departmentsData.length === 0;
  const noCoursesFound = !!selectedDepartment && coursesData.length === 0;
  const noTopicsFound = !!selectedCourse && scopedTopicsData.length === 0;

  const materialUploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCourse) {
        throw new Error('Please select a course');
      }
      if (!uploadTitle.trim()) {
        throw new Error('Please enter a material title');
      }
      if (!uploadFile) {
        throw new Error('Please choose a file to upload');
      }
      if (!selectedTopic) {
        throw new Error('Please select a topic for this material');
      }

      return sourceMaterialService.uploadMaterial(selectedCourse, {
        title: uploadTitle.trim(),
        description: uploadDescription.trim() || undefined,
        fileType: uploadFileType || undefined,
        file: uploadFile,
        topicId: selectedTopic,
      });
    },
    onSuccess: (material: any) => {
      const materialId = getMaterialId(material);
      toast.success(materialId ? `Material uploaded: ${materialId}` : 'Material uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['materials', selectedCourse] });
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      setShowMaterialUpload(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to upload material');
    },
  });

  // Manual question mutation
  const manualQuestionMutation = useMutation({
    mutationFn: async (data: ManualQuestionForm) => {
      // Validate topicId is provided
      if (!data.topicId || data.topicId.trim() === '') {
        throw new Error('Topic ID is required to create a question');
      }

      const payload = {
        courseId: data.courseId,
        topicId: data.topicId,
        text: data.text,
        options: {
          A: data.optionA,
          B: data.optionB,
          C: data.optionC,
          D: data.optionD,
        },
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty,
        approved: true,
        status: 'approved',
        sourceType: 'manual',
        source: 'Human',
        explanation: data.explanation,
      };

      console.log('Creating question with payload:', payload);
      return questionService.createQuestion(payload as any);
    },
    onSuccess: () => {
      toast.success('Question created successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      resetManualForm();
      setShowManualForm(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create question';
      const details = error?.response?.data?.details || error?.response?.data?.error;
      console.error('Question creation error:', { message, details, full: error });
      toast.error(message);
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: ({ questionId, courseId }: { questionId: string; courseId?: string }) =>
      adminService.deleteQuestion(courseId || '', questionId),
    onSuccess: () => {
      toast.success('Question deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete question');
    },
  });

  const editQuestionMutation = useMutation({
    mutationFn: async ({
      questionId,
      courseId,
      payload,
    }: {
      questionId: string;
      courseId?: string;
      payload: any;
    }) => {
      return questionService.updateQuestion(questionId, payload);
    },
    onSuccess: () => {
      toast.success('Question updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      setIsEditModalOpen(false);
      setEditingQuestionId('');
      setEditingCourseId('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update question');
    },
  });

  // Manual form
  const {
    register: registerManual,
    handleSubmit: handleManualSubmit,
    reset: resetManual,
    formState: { errors: manualErrors },
  } = useForm<ManualQuestionForm>({
    resolver: zodResolver(manualQuestionSchema),
  });

  const resetManualForm = () => {
    resetManual();
    setSelectedCourse('');
    setSelectedTopic('');
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const questionText = ((q as any)?.question || (q as any)?.text || '').toString();
    const matchesSearch = questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'manual':
        return 'bg-blue-100 text-blue-700';
      case 'generated':
      case 'extracted':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getNormalizedSourceType = (question: any): 'manual' | 'generated' | 'extracted' | 'unknown' => {
    const sourceType = String(question?.sourceType || '').toLowerCase();
    const source = String(question?.source || '').toLowerCase();

    if (sourceType === 'manual' || source === 'human') return 'manual';
    if (sourceType === 'generated') return 'generated';
    if (sourceType === 'extracted' || source === 'ai') return 'extracted';
    return 'unknown';
  };

  const getSourceLabel = (question: any): string => {
    const sourceType = getNormalizedSourceType(question);
    if (sourceType === 'manual') return 'Manual';
    if (sourceType === 'generated') return 'AI Generated';
    if (sourceType === 'extracted') return 'Extracted';
    return 'Unknown';
  };

  const isQuestionApproved = (question: any): boolean => {
    return question?.approved === true || question?.status === 'approved';
  };

  // Stats
  const stats = {
    total: Number(allQuestionTotals?.total ?? questionsData?.total ?? questions.length),
    approved: Number(
      allQuestionTotals?.approved ?? questions.filter((q) => isQuestionApproved(q)).length
    ),
    pending: Number(
      allQuestionTotals?.pending ?? questions.filter((q) => !isQuestionApproved(q)).length
    ),
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };

  const normalizedPage = Math.max(Number((questionsData as any)?.page || currentPage || 1), 1);
  const normalizedTotal = Math.max(Number((questionsData as any)?.total || 0), 0);
  const normalizedLimit = Math.max(Number((questionsData as any)?.limit || pageSize || 1), 1);
  const totalPages = Math.max(
    Number(
      (questionsData as any)?.totalPages ||
        (questionsData as any)?.pagination?.pages ||
        Math.ceil(normalizedTotal / normalizedLimit) ||
        1
    ),
    1
  );

  const getQuestionCourseId = (question: any): string => {
    return String(
      question?.courseId ||
        question?.course?._id ||
        question?.course?.id ||
        question?.course ||
        selectedCourse ||
        ''
    );
  };

  const handleEditQuestion = (question: any) => {
    const questionId = String(question?.id || question?._id || '');
    const courseId = getQuestionCourseId(question);
    if (!questionId) {
      toast.error('Unable to edit this question');
      return;
    }

    const options = getNormalizedOptions(question);
    const optionText = (optionId: string) =>
      options.find((option) => String(option.id).toUpperCase() === optionId)?.text || '';

    setEditingQuestionId(questionId);
    setEditingCourseId(courseId);
    setEditForm({
      text: String(question?.text || question?.question || ''),
      optionA: optionText('A'),
      optionB: optionText('B'),
      optionC: optionText('C'),
      optionD: optionText('D'),
      correctAnswer: (String(question?.correctAnswer || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D'),
      difficulty: (question?.difficulty || 'easy') as 'easy' | 'medium' | 'hard',
      explanation: String(question?.explanation || ''),
    });
    setIsEditModalOpen(true);
  };

  const submitEditQuestion = () => {
    if (!editingQuestionId) {
      toast.error('Unable to update this question');
      return;
    }
    if (!editForm.text.trim() || !editForm.optionA.trim() || !editForm.optionB.trim() || !editForm.optionC.trim() || !editForm.optionD.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    editQuestionMutation.mutate({
      questionId: editingQuestionId,
      courseId: editingCourseId,
      payload: {
        text: editForm.text.trim(),
        options: {
          A: editForm.optionA.trim(),
          B: editForm.optionB.trim(),
          C: editForm.optionC.trim(),
          D: editForm.optionD.trim(),
        },
        correctAnswer: editForm.correctAnswer,
        difficulty: editForm.difficulty,
        explanation: editForm.explanation.trim() || undefined,
      },
    });
  };

  const getNormalizedOptions = (question: any): Array<{ id: string; text: string }> => {
    const options = question?.options;
    if (Array.isArray(options)) {
      return options;
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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank</h1>
            <p className="text-gray-600">Create questions here. Use Manage Questions to edit, delete, reject, and approve.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/questions-mgmt')}
              className="flex items-center gap-2 bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <AlertCircle className="w-5 h-5" />
              Manage Questions
            </button>
            <button
              onClick={() => {
                setShowMaterialUpload(!showMaterialUpload);
              }}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Upload className="w-5 h-5" />
              Upload Material
            </button>
            <button
              onClick={() => navigate('/admin/source-materials')}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <BookOpen className="w-5 h-5" />
              Generate & Import
            </button>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Question
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Admin Workflow</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm text-blue-800">
            <p><span className="font-semibold">1.</span> Upload Material</p>
            <p><span className="font-semibold">2.</span> Generate &amp; Import Questions</p>
            <p><span className="font-semibold">3.</span> Edit Questions</p>
            <p><span className="font-semibold">4.</span> Approve Questions</p>
          </div>
        </div>

        {/* Material Upload Panel */}
        {showMaterialUpload && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Source Material</h2>
                <p className="text-gray-600">Step 1: Upload source material. Step 2: Use Generate & Import to process questions.</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                materialUploadMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University *</label>
                  <select
                    value={selectedUniversity}
                    onChange={(e) => {
                      setSelectedUniversity(e.target.value);
                      setSelectedDepartment('');
                      setSelectedCourse('');
                      setSelectedTopic('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select university</option>
                    {universities.map((uni) => (
                      <option key={getEntityId(uni)} value={getEntityId(uni)}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedCourse('');
                      setSelectedTopic('');
                    }}
                    disabled={!selectedUniversity}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select department</option>
                    {departmentsData.map((dept: any) => (
                      <option key={getEntityId(dept)} value={getEntityId(dept)}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      setSelectedTopic('');
                    }}
                    disabled={!selectedDepartment}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select course</option>
                    {coursesData.map((course: any) => {
                      const courseCode = course.code || course.courseCode || '';
                      const courseTitle = course.title || course.name || '';
                      const courseId = getEntityId(course);
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    disabled={!selectedCourse}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select topic</option>
                    {scopedTopicsData.map((topic: any) => (
                      <option key={getEntityId(topic)} value={getEntityId(topic)}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Material Title *</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter material title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File Type (Optional)</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value as '' | 'pdf' | 'image' | 'text' | 'docx')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Auto-detect</option>
                    <option value="pdf">PDF</option>
                    <option value="image">Image (saved as document)</option>
                    <option value="text">Text (saved as document)</option>
                    <option value="docx">DOCX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload File *</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Optional description for this material"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={materialUploadMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {materialUploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Material
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMaterialUpload(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manual Question Form */}
        {showManualForm && (
          <div className="bg-white rounded-xl border-2 border-green-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add Question Manually</h2>
                <p className="text-gray-600">Create a new exam question (requires approval before use)</p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit((data) => manualQuestionMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University *
                  </label>
                  <select
                    value={selectedUniversity}
                    onChange={(e) => {
                      setSelectedUniversity(e.target.value);
                      setSelectedDepartment('');
                      setSelectedCourse('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select university</option>
                    {universities.map(uni => (
                      <option key={getEntityId(uni)} value={getEntityId(uni)}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value);
                      setSelectedCourse('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!selectedUniversity}
                    required
                  >
                    <option value="">Select department</option>
                    {departmentsData.map(dept => (
                      <option key={getEntityId(dept)} value={getEntityId(dept)}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {noDepartmentsFound && (
                    <p className="text-xs text-amber-600 mt-1">No departments found for selected university.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    {...registerManual('courseId')}
                    value={selectedCourse}
                    onChange={(e) => {
                      setSelectedCourse(e.target.value);
                      // Update form value
                      const event = { target: { value: e.target.value } } as any;
                      registerManual('courseId').onChange(event);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!selectedDepartment}
                    required
                  >
                    <option value="">Select course</option>
                    {coursesData.map((course: any) => {
                      const courseCode = course.code || course.courseCode || '';
                      const courseTitle = course.title || course.name || '';
                      const courseId = getEntityId(course);
                      const displayName = courseCode && courseCode.toString().trim() ? `${courseCode} - ${courseTitle}` : courseTitle || `Course ${courseId}`;
                      return (
                        <option key={courseId} value={courseId}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                  {noCoursesFound && (
                    <p className="text-xs text-amber-600 mt-1">No courses found for selected department.</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic *
                  </label>
                  <select
                    {...registerManual('topicId')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!selectedCourse}
                  >
                    <option value="">Select a topic</option>
                    {scopedTopicsData.map(topic => (
                      <option key={getEntityId(topic)} value={getEntityId(topic)}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  {noTopicsFound && (
                    <p className="text-xs text-amber-600 mt-1">No topics found for selected course.</p>
                  )}
                  {manualErrors.topicId && (
                    <p className="text-red-600 text-sm mt-1">{manualErrors.topicId.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question *
                </label>
                <textarea
                  {...registerManual('text')}
                  placeholder="Enter your question here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px]"
                />
                {manualErrors.text && (
                  <p className="text-red-600 text-sm mt-1">{manualErrors.text.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Option {option} *
                    </label>
                    <input
                      {...registerManual(`option${option}` as any)}
                      placeholder={`Enter option ${option}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {Object.keys(manualErrors).includes(`option${option}`) && (
                      <p className="text-red-600 text-sm mt-1">{(manualErrors as any)[`option${option}`]?.message}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <select
                    {...registerManual('correctAnswer')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select answer</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                  {manualErrors.correctAnswer && (
                    <p className="text-red-600 text-sm mt-1">{manualErrors.correctAnswer.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    {...registerManual('difficulty')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  {manualErrors.difficulty && (
                    <p className="text-red-600 text-sm mt-1">{manualErrors.difficulty.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  {...registerManual('explanation')}
                  placeholder="Explain why this is the correct answer..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={manualQuestionMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {manualQuestionMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Save Question
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowManualForm(false);
                    resetManualForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Question</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question *</label>
                  <textarea
                    value={editForm.text}
                    onChange={(e) => setEditForm((previous) => ({ ...previous, text: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option A *</label>
                    <input
                      type="text"
                      value={editForm.optionA}
                      onChange={(e) => setEditForm((previous) => ({ ...previous, optionA: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option B *</label>
                    <input
                      type="text"
                      value={editForm.optionB}
                      onChange={(e) => setEditForm((previous) => ({ ...previous, optionB: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option C *</label>
                    <input
                      type="text"
                      value={editForm.optionC}
                      onChange={(e) => setEditForm((previous) => ({ ...previous, optionC: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Option D *</label>
                    <input
                      type="text"
                      value={editForm.optionD}
                      onChange={(e) => setEditForm((previous) => ({ ...previous, optionD: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correct Answer *</label>
                    <select
                      value={editForm.correctAnswer}
                      onChange={(e) => setEditForm((previous) => ({ ...previous, correctAnswer: e.target.value as 'A' | 'B' | 'C' | 'D' }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                    <select
                      value={editForm.difficulty}
                      onChange={(e) => setEditForm((previous) => ({ ...previous, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                  <textarea
                    value={editForm.explanation}
                    onChange={(e) => setEditForm((previous) => ({ ...previous, explanation: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={submitEditQuestion}
                    disabled={editQuestionMutation.isPending}
                    className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors font-medium"
                  >
                    {editQuestionMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Approved</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Pending</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Easy</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.easy}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Medium</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.medium}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Hard</h3>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.hard}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as any)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
              >
                <option value="all">All Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        {questionsLoading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto" />
            <p className="text-gray-600 mt-4">Loading questions...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-6">Create your first question to get started</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowManualForm(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Question
              </button>
              <button
                onClick={() => navigate('/admin/source-materials')}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <BookOpen className="w-5 h-5" />
                Generate & Import
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={(question as any).id || (question as any)._id}
                className={`bg-white rounded-xl border-2 p-6 transition-colors ${
                  isQuestionApproved(question) ? 'border-gray-200' : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor(getNormalizedSourceType(question))}`}>
                        {getSourceLabel(question)}
                      </span>
                      {!isQuestionApproved(question) && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                      {question.text }
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuestion(question)}
                      disabled={editQuestionMutation.isPending}
                      className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Edit question"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        deleteQuestionMutation.mutate({
                          questionId: String((question as any).id || (question as any)._id || ''),
                          courseId: getQuestionCourseId(question),
                        })
                      }
                      disabled={deleteQuestionMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {getNormalizedOptions(question).map((option) => (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border-2 ${
                        option.id === question.correctAnswer
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${
                          option.id === question.correctAnswer ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {option.id}.
                        </span>
                        <span className={option.id === question.correctAnswer ? 'text-green-700' : 'text-gray-900'}>
                          {option.text}
                        </span>
                        {option.id === question.correctAnswer && (
                          <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-blue-900 mb-1">Explanation:</p>
                    <p className="text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-sm text-gray-600">Page {normalizedPage} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={normalizedPage <= 1 || questionsLoading}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={normalizedPage >= totalPages || questionsLoading}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
