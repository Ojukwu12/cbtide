import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '../../components/Layout';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  Brain,
  BookOpen,
  AlertCircle,
  Plus,
  Upload,
  Sparkles,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import { questionService } from '../../../lib/services/question.service';
import { academicService } from '../../../lib/services/academic.service';
import { Question } from '../../../types';
import { toast } from 'sonner';

// Manual question creation schema
const manualQuestionSchema = z.object({
  question: z.string().min(10, 'Question must be at least 10 characters'),
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

// AI generation schema
const aiGenerationSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  numberOfQuestions: z.number().min(1).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
});

type AIGenerationForm = z.infer<typeof aiGenerationSchema>;

export function QuestionBank() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<'easy' | 'medium' | 'hard' | 'all'>('all');
  const [filterCourse, setFilterCourse] = useState('all');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch all questions
  const { data: questionsData = { data: [], total: 0, page: 1, limit: 10 }, isLoading: questionsLoading } = useQuery({
    queryKey: ['all-questions'],
    queryFn: () => questionService.getQuestions({ limit: 1000 }),
  });

  const questions = questionsData.data || [];

  // Fetch all universities/courses
  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: () => academicService.getUniversities(),
  });

  // Fetch topics for selected course
  const { data: topicsData = [] } = useQuery({
    queryKey: ['topics', selectedCourse],
    queryFn: () => academicService.getTopics(selectedCourse),
    enabled: !!selectedCourse,
  });


  // Manual question mutation
  const manualQuestionMutation = useMutation({
    mutationFn: async (data: ManualQuestionForm) => {
      return questionService.createQuestion({
        topicId: data.topicId,
        question: data.question,
        options: [
          { id: 'A', text: data.optionA },
          { id: 'B', text: data.optionB },
          { id: 'C', text: data.optionC },
          { id: 'D', text: data.optionD },
        ],
        correctAnswer: data.correctAnswer,
        difficulty: data.difficulty,
        approved: true, // Manual questions don't need approval
        sourceType: 'manual',
        explanation: data.explanation,
      } as any);
    },
    onSuccess: () => {
      toast.success('Question created successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      resetManualForm();
      setShowManualForm(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create question');
    },
  });

  // AI generation mutation (placeholder - backend endpoint may vary)
  const aiGenerationMutation = useMutation({
    mutationFn: async (data: AIGenerationForm) => {
      // This would typically call a dedicated AI generation endpoint
      // For now, showing the structure
      toast.loading('Generating questions with AI...');
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ generated: data.numberOfQuestions });
        }, 2000);
      });
    },
    onSuccess: () => {
      toast.success('Questions generated! Pending approval.');
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
      resetAIForm();
      setShowAIGenerator(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to generate questions');
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId: string) => questionService.deleteQuestion(questionId),
    onSuccess: () => {
      toast.success('Question deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['all-questions'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete question');
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

  // AI form
  const {
    register: registerAI,
    handleSubmit: handleAISubmit,
    reset: resetAI,
    formState: { errors: aiErrors },
  } = useForm<AIGenerationForm>({
    resolver: zodResolver(aiGenerationSchema),
  });

  const resetAIForm = () => {
    resetAI();
    setSelectedCourse('');
  };

  // Filter questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  // Stats
  const stats = {
    total: questions.length,
    approved: questions.filter(q => q.approved).length,
    pending: questions.filter(q => !q.approved).length,
    easy: questions.filter(q => q.difficulty === 'easy').length,
    medium: questions.filter(q => q.difficulty === 'medium').length,
    hard: questions.filter(q => q.difficulty === 'hard').length,
  };

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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Question Bank</h1>
            <p className="text-gray-600">Create, manage, and approve exam questions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAIGenerator(!showAIGenerator)}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              <Brain className="w-5 h-5" />
              AI Generate
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

        {/* AI Generator Panel */}
        {showAIGenerator && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Question Generator</h2>
                <p className="text-gray-600">Generate practice questions using AI</p>
              </div>
            </div>

            <form onSubmit={handleAISubmit(async (data) => aiGenerationMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a course</option>
                    {universities.map(uni => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty *
                  </label>
                  <select
                    {...registerAI('difficulty')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  {aiErrors.difficulty && (
                    <p className="text-red-600 text-sm mt-1">{aiErrors.difficulty.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Prompt *
                </label>
                <textarea
                  {...registerAI('prompt')}
                  placeholder="E.g., 'Generate 10 medium difficulty questions about binary trees and tree traversal algorithms'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
                />
                {aiErrors.prompt && (
                  <p className="text-red-600 text-sm mt-1">{aiErrors.prompt.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Questions (1-50) *
                </label>
                <input
                  {...registerAI('numberOfQuestions', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={50}
                  defaultValue={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {aiErrors.numberOfQuestions && (
                  <p className="text-red-600 text-sm mt-1">{aiErrors.numberOfQuestions.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={aiGenerationMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {aiGenerationMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Questions
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAIGenerator(false)}
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
                <p className="text-gray-600">Create a new exam question (no approval needed)</p>
              </div>
            </div>

            <form onSubmit={handleManualSubmit((data) => manualQuestionMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a course</option>
                    {universities.map(uni => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
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
                    {topicsData.map(topic => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
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
                  {...registerManual('question')}
                  placeholder="Enter your question here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px]"
                />
                {manualErrors.question && (
                  <p className="text-red-600 text-sm mt-1">{manualErrors.question.message}</p>
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
                    {manualErrors[`option${option}` as any] && (
                      <p className="text-red-600 text-sm mt-1">{manualErrors[`option${option}` as any]?.message}</p>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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
                onClick={() => setShowAIGenerator(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Brain className="w-5 h-5" />
                Generate with AI
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className={`bg-white rounded-xl border-2 p-6 transition-colors ${
                  question.approved ? 'border-gray-200' : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSourceColor(question.sourceType)}`}>
                        {question.sourceType === 'manual' ? 'Manual' : question.sourceType === 'generated' ? 'AI Generated' : 'Extracted'}
                      </span>
                      {!question.approved && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                      {question.question}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteQuestionMutation.mutate(question.id)}
                      disabled={deleteQuestionMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete question"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {question.options.map((option) => (
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
          </div>
        )}
      </div>
    </Layout>
  );
}

        {/* AI Generator Panel */}
        {showAIGenerator && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Question Generator</h2>
                <p className="text-gray-600">Generate questions from prompts or study materials</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course & Topic
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="e.g., Computer Science 301"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Prompt (Optional)
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what kind of questions you want... e.g., 'Generate 10 medium difficulty questions about binary trees and tree traversal algorithms'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Study Materials (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedFile ? selectedFile.name : 'Drop files here or click to upload'}
                  </p>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX, TXT up to 10MB</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    defaultValue={10}
                    min={1}
                    max={50}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Mixed</option>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Multiple Choice</option>
                    <option>True/False</option>
                    <option>Mixed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleGenerateQuestions}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Questions
                </button>
                <button
                  onClick={() => setShowAIGenerator(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
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
                <p className="text-gray-600">Create a new exam question</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Computer Science 301"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Data Structures"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question
                </label>
                <textarea
                  placeholder="Enter your question here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Option {option}
                    </label>
                    <input
                      type="text"
                      placeholder={`Enter option ${option}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                    <option>D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    alert('Question added successfully!');
                    setShowManualForm(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CheckCircle className="w-5 h-5" />
                  Save Question
                </button>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Questions</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Easy</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.easy}</p>
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
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
              >
                {courses.map(course => (
                  <option key={course} value={course}>
                    {course === 'all' ? 'All Courses' : course}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | 'all')}
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
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(question.difficulty)}`}>
                      {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                    </span>
                    {question.source === 'ai' && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        AI Generated
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {question.question}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{question.course}</span>
                    <span>•</span>
                    <span>{question.topic}</span>
                    <span>•</span>
                    <span>{question.createdDate}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditQuestion(question.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit question"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {question.options.map((option) => (
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
            </div>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowAIGenerator(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Brain className="w-5 h-5" />
                Generate with AI
              </button>
              <button
                onClick={() => setShowManualForm(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Add Manually
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}